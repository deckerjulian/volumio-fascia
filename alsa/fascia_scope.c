/*
 * ALSA-"meter"-Scope für den Band-Analyzer von Fascia.
 *
 * Das ALSA-Plugin "meter" reicht den Ton unverändert an das nächste Gerät weiter und ruft
 * regelmäßig seine Scopes auf. Dieser Scope mischt das Signal auf mono, reduziert Hi-Res-Raten
 * auf 44,1/48 kHz und schreibt es als S16LE in einen FIFO, den lib/spectrum-worker.js liest.
 *
 * Oberstes Gebot: die Wiedergabe nie behindern.
 *  - Der FIFO wird mit O_RDWR | O_NONBLOCK geöffnet. Damit blockiert open() nie, und weil der
 *    Scope selbst ein Leseende hält, gibt es auch ohne Leser weder SIGPIPE noch EPIPE.
 *  - Ist der FIFO voll (niemand liest), werden die Daten verworfen (EAGAIN).
 *  - Jeder write() ist höchstens PIPE_BUF groß und damit atomar; Samples bleiben ausgerichtet.
 *  - Fehlt der FIFO oder klappt etwas nicht, macht der Scope einfach nichts.
 *
 * Build (siehe build.sh): gcc -shared -fPIC -DPIC -O2 -o libfascia_scope.so fascia_scope.c -lasound
 */

#include <alsa/asoundlib.h>
#include <errno.h>
#include <fcntl.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>
#include <time.h>
#include <unistd.h>

#define OUT_SAMPLES 2048  /* 4096 Byte = PIPE_BUF: atomarer write() */

typedef struct {
	snd_pcm_t *pcm;
	snd_pcm_scope_t *s16;
	snd_pcm_uframes_t old;
	char *fifo;
	char *ratefile;
	int fd;
	time_t last_try;
	unsigned int factor;
	long acc;
	unsigned int accn;
	int16_t out[OUT_SAMPLES];
	unsigned int nout;
} fascia_t;

static void fascia_close_fifo(fascia_t *t)
{
	if (t->fd >= 0)
		close(t->fd);
	t->fd = -1;
}

static void fascia_open_fifo(fascia_t *t)
{
	time_t now;

	if (t->fd >= 0)
		return;
	now = time(NULL);
	if (now == t->last_try)  /* höchstens ein Versuch pro Sekunde */
		return;
	t->last_try = now;

	t->fd = open(t->fifo, O_RDWR | O_NONBLOCK | O_CLOEXEC);
	if (t->fd < 0 && errno == ENOENT) {
		/* Ohne O_CREAT anlegen (fs.protected_fifos) und für alle Audio-Benutzer freigeben */
		if (mkfifo(t->fifo, 0666) == 0)
			chmod(t->fifo, 0666);
		t->fd = open(t->fifo, O_RDWR | O_NONBLOCK | O_CLOEXEC);
	}
	if (t->fd >= 0) {
		struct stat st;
		if (fstat(t->fd, &st) < 0 || !S_ISFIFO(st.st_mode))
			fascia_close_fifo(t);
	}
}

static void fascia_flush(fascia_t *t)
{
	if (!t->nout)
		return;
	if (t->fd >= 0) {
		ssize_t w = write(t->fd, t->out, t->nout * sizeof(int16_t));
		if (w < 0 && errno != EAGAIN && errno != EINTR)
			fascia_close_fifo(t);
	}
	t->nout = 0;
}

/*
 * Die Audio-Programme laufen unter verschiedenen Benutzern (mpd, shairport-sync, volumio …).
 * In /tmp (Sticky-Bit) darf keiner die Datei eines anderen per rename() ersetzen, und O_CREAT auf
 * fremde Dateien verhindert fs.protected_regular. Deshalb: vorhandene Datei ohne O_CREAT
 * überschreiben, nur eine fehlende neu anlegen (für alle beschreibbar).
 */
static void fascia_write_rate(fascia_t *t, unsigned int rate)
{
	char buf[32];
	int fd, n;

	if (!t->ratefile)
		return;
	fd = open(t->ratefile, O_WRONLY | O_TRUNC | O_CLOEXEC);
	if (fd < 0 && errno == ENOENT) {
		fd = open(t->ratefile, O_WRONLY | O_CREAT | O_EXCL | O_CLOEXEC, 0666);
		if (fd >= 0)
			fchmod(fd, 0666);
	}
	if (fd < 0)
		return;
	n = snprintf(buf, sizeof(buf), "%u\n", rate);
	if (write(fd, buf, n) < 0) {
		/* egal: der Leser bleibt dann bei der bisherigen Rate */
	}
	close(fd);
}

static void fascia_feed(fascia_t *t, snd_pcm_uframes_t offset, snd_pcm_uframes_t frames, unsigned int channels)
{
	int16_t *l, *r;
	snd_pcm_uframes_t i;

	if (!frames)
		return;
	l = snd_pcm_scope_s16_get_channel_buffer(t->s16, 0);
	r = channels > 1 ? snd_pcm_scope_s16_get_channel_buffer(t->s16, 1) : l;
	if (!l || !r)
		return;
	l += offset;
	r += offset;
	for (i = 0; i < frames; i++) {
		t->acc += (long)l[i] + (long)r[i];
		t->accn += 2;
		if (t->accn >= 2 * t->factor) {
			t->out[t->nout++] = (int16_t)(t->acc / (long)t->accn);
			t->acc = 0;
			t->accn = 0;
			if (t->nout == OUT_SAMPLES)
				fascia_flush(t);
		}
	}
}

static int fascia_enable(snd_pcm_scope_t *scope)
{
	(void)scope;
	return 0;
}

static void fascia_disable(snd_pcm_scope_t *scope)
{
	(void)scope;
}

static void fascia_start(snd_pcm_scope_t *scope)
{
	fascia_t *t = snd_pcm_scope_get_callback_private(scope);
	unsigned int rate = snd_pcm_meter_get_rate(t->pcm);

	t->factor = rate >= 176400 ? 4 : rate >= 88200 ? 2 : 1;
	t->acc = 0;
	t->accn = 0;
	t->nout = 0;
	t->old = snd_pcm_meter_get_now(t->pcm);
	fascia_write_rate(t, rate / t->factor);
}

static void fascia_stop(snd_pcm_scope_t *scope)
{
	fascia_t *t = snd_pcm_scope_get_callback_private(scope);

	fascia_flush(t);
	/* Schließen: der Leser bekommt EOF und lässt die Balken fallen */
	fascia_close_fifo(t);
	t->last_try = 0;
}

static void fascia_update(snd_pcm_scope_t *scope)
{
	fascia_t *t = snd_pcm_scope_get_callback_private(scope);
	snd_pcm_t *pcm = t->pcm;
	snd_pcm_uframes_t bufsize = snd_pcm_meter_get_bufsize(pcm);
	snd_pcm_uframes_t now = snd_pcm_meter_get_now(pcm);
	snd_pcm_uframes_t boundary = snd_pcm_meter_get_boundary(pcm);
	unsigned int channels = snd_pcm_meter_get_channels(pcm);
	snd_pcm_sframes_t size;
	snd_pcm_uframes_t offset, cont, size1, size2;

	size = (snd_pcm_sframes_t)(now - t->old);
	if (size < 0)
		size += boundary;
	t->old = now;
	if (size <= 0 || !bufsize || !channels)
		return;
	if ((snd_pcm_uframes_t)size > bufsize)
		size = bufsize;

	fascia_open_fifo(t);
	if (t->fd < 0)
		return;

	/* Startposition der neuen Frames; boundary ist ein Vielfaches von bufsize */
	offset = (now >= (snd_pcm_uframes_t)size ? now - size : now + boundary - size) % bufsize;
	cont = bufsize - offset;
	size1 = (snd_pcm_uframes_t)size > cont ? cont : (snd_pcm_uframes_t)size;
	size2 = size - size1;
	fascia_feed(t, offset, size1, channels);
	fascia_feed(t, 0, size2, channels);
	fascia_flush(t);
}

static void fascia_reset(snd_pcm_scope_t *scope)
{
	fascia_t *t = snd_pcm_scope_get_callback_private(scope);

	t->old = snd_pcm_meter_get_now(t->pcm);
	t->acc = 0;
	t->accn = 0;
	t->nout = 0;
}

static void fascia_close(snd_pcm_scope_t *scope)
{
	fascia_t *t = snd_pcm_scope_get_callback_private(scope);

	fascia_close_fifo(t);
	free(t->fifo);
	free(t->ratefile);
	free(t);
}

static const snd_pcm_scope_ops_t fascia_ops = {
	.enable = fascia_enable,
	.disable = fascia_disable,
	.start = fascia_start,
	.stop = fascia_stop,
	.update = fascia_update,
	.reset = fascia_reset,
	.close = fascia_close,
};

int _snd_pcm_scope_fascia_open(snd_pcm_t *pcm, const char *name,
				 snd_config_t *root, snd_config_t *conf)
{
	snd_config_iterator_t i, next;
	snd_pcm_scope_t *scope, *s16;
	const char *fifo = "/tmp/fascia_alsa.fifo";
	const char *ratefile = "/tmp/fascia_alsa.rate";
	fascia_t *t;
	int err;

	(void)root;
	snd_config_for_each(i, next, conf) {
		snd_config_t *n = snd_config_iterator_entry(i);
		const char *id;
		if (snd_config_get_id(n, &id) < 0)
			continue;
		if (strcmp(id, "comment") == 0 || strcmp(id, "type") == 0)
			continue;
		if (strcmp(id, "fifo") == 0) {
			if (snd_config_get_string(n, &fifo) < 0)
				return -EINVAL;
			continue;
		}
		if (strcmp(id, "ratefile") == 0) {
			if (snd_config_get_string(n, &ratefile) < 0)
				return -EINVAL;
			continue;
		}
		SNDERR("Unknown field %s", id);
		return -EINVAL;
	}

	t = calloc(1, sizeof(*t));
	if (!t)
		return -ENOMEM;
	t->pcm = pcm;
	t->fd = -1;
	t->factor = 1;
	t->fifo = strdup(fifo);
	t->ratefile = strdup(ratefile);
	if (!t->fifo || !t->ratefile) {
		free(t->fifo);
		free(t->ratefile);
		free(t);
		return -ENOMEM;
	}

	err = snd_pcm_scope_malloc(&scope);
	if (err < 0) {
		free(t->fifo);
		free(t->ratefile);
		free(t);
		return err;
	}
	s16 = snd_pcm_meter_search_scope(pcm, "s16");
	if (!s16) {
		err = snd_pcm_scope_s16_open(pcm, "s16", &s16);
		if (err < 0) {
			free(scope);
			free(t->fifo);
			free(t->ratefile);
			free(t);
			return err;
		}
	}
	t->s16 = s16;
	snd_pcm_scope_set_name(scope, name);
	snd_pcm_scope_set_ops(scope, &fascia_ops);
	snd_pcm_scope_set_callback_private(scope, t);
	snd_pcm_meter_add_scope(pcm, scope);
	return 0;
}
SND_DLSYM_BUILD_VERSION(_snd_pcm_scope_fascia_open, SND_PCM_SCOPE_DLSYM_VERSION);
