#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
TOOLS_DIR="${PROJECT_DIR}/.tools"
MOTION_DIR="${TOOLS_DIR}/quaternius-universal-animation-library-standard"
MOTION_FILE="${MOTION_DIR}/AnimationLibrary_Godot_Standard.glb"
OUTPUT_DIR="${PROJECT_DIR}/public/assets/lcd-platformer/mecha"
OUTPUT_FILE="${OUTPUT_DIR}/motion-atlas.png"
FRAMES_PER_CLIP="12"
CELL_SIZE="320"

"${PROJECT_DIR}/scripts/assets/setup-motion-source.sh" >/dev/null
mkdir -p "${OUTPUT_DIR}"
FRAME_DIR="$(mktemp -d "${TOOLS_DIR}/.mecha-motion-frames.XXXXXX")"

cleanup() {
  rm -rf "${FRAME_DIR}"
}
trap cleanup EXIT

SDL_AUDIODRIVER=dummy "${SCRIPT_DIR}/run.sh" -noaudio --background --factory-startup \
  --python "${SCRIPT_DIR}/mecha_motion.py" -- \
  --source "${MOTION_FILE}" \
  --output-dir "${FRAME_DIR}" \
  --frames-per-clip "${FRAMES_PER_CLIP}" \
  --cell-size "${CELL_SIZE}"

node "${PROJECT_DIR}/scripts/assets/compose-atlas.mjs" \
  --input-dir "${FRAME_DIR}" \
  --output "${OUTPUT_FILE}" \
  --columns "${FRAMES_PER_CLIP}" \
  --rows 5 \
  --cell-size "${CELL_SIZE}"

echo "${OUTPUT_FILE}"
