#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
BLENDER_BIN="${PROJECT_DIR}/.tools/blender-5.2.1-linux-x64/blender"
BLENDER_CONFIG_DIR="${PROJECT_DIR}/.tools/blender-config"
MESA_CACHE_DIR="${PROJECT_DIR}/.tools/mesa-shader-cache"
PULSE_CACHE_DIR="${PROJECT_DIR}/.tools/pulse-runtime"

if [[ ! -x "${BLENDER_BIN}" ]]; then
  "${SCRIPT_DIR}/setup.sh"
fi

mkdir -p "${BLENDER_CONFIG_DIR}" "${MESA_CACHE_DIR}" "${PULSE_CACHE_DIR}"
export BLENDER_USER_CONFIG="${BLENDER_CONFIG_DIR}"
export MESA_SHADER_CACHE_DIR="${MESA_CACHE_DIR}"
export PULSE_RUNTIME_PATH="${PULSE_CACHE_DIR}"

exec "${BLENDER_BIN}" "$@"
