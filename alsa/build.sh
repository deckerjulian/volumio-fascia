#!/bin/bash
# Baut den ALSA-Scope für alle Volumio-Architekturen in Docker (Debian Bookworm, passend zu Volumio 4).
# Ergebnis: alsa/lib/<node-arch>/libtouchbar_scope.so  (arm = armhf, arm64, x64 = amd64)
set -euo pipefail
cd "$(dirname "$0")"

build() {
  local platform=$1 arch=$2 flags=$3
  echo "== $arch ($platform)"
  mkdir -p "lib/$arch"
  docker run --rm --platform "$platform" -v "$PWD:/src" -w /src debian:bookworm bash -c "
    apt-get update -qq >/dev/null &&
    apt-get install -y -qq --no-install-recommends gcc libc6-dev libasound2-dev >/dev/null &&
    gcc -shared -fPIC -DPIC -O2 -Wall -Wextra $flags -o lib/$arch/libtouchbar_scope.so touchbar_scope.c -lasound &&
    strip lib/$arch/libtouchbar_scope.so"
}

# Raspberry Pi (32 Bit, auch Pi Zero/1: ARMv6 mit VFP)
build linux/arm/v7 arm "-marm -march=armv6 -mfpu=vfp -mfloat-abi=hard"
build linux/arm64 arm64 ""
build linux/amd64 x64 ""
ls -la lib/*/
