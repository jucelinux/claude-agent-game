#!/usr/bin/env bash
set -euo pipefail

SOURCE_NAME="quaternius-universal-animation-library-standard"
SOURCE_SHA256="18ff1a7215f4852b320203e8aaf02a1578b5c8eef9027fbaedfcedc7b85a3ac2"
SOURCE_URL="https://opengameart.org/sites/default/files/universal_animation_librarystandard.zip"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
TOOLS_DIR="${PROJECT_DIR}/.tools"
INSTALL_DIR="${TOOLS_DIR}/${SOURCE_NAME}"
MOTION_FILE="${INSTALL_DIR}/AnimationLibrary_Godot_Standard.glb"

if [[ -f "${MOTION_FILE}" ]]; then
  echo "${MOTION_FILE}"
  exit 0
fi

mkdir -p "${TOOLS_DIR}"
ARCHIVE_PATH="$(mktemp "${TOOLS_DIR}/.${SOURCE_NAME}.XXXXXX.zip")"
EXTRACT_DIR="$(mktemp -d "${TOOLS_DIR}/.${SOURCE_NAME}.XXXXXX")"

cleanup() {
  rm -f "${ARCHIVE_PATH}"
  rm -rf "${EXTRACT_DIR}"
}
trap cleanup EXIT

echo "Preparing the CC0 motion source by Quaternius..."
if [[ -n "${MOTION_SOURCE_ARCHIVE_PATH:-}" ]]; then
  cp "${MOTION_SOURCE_ARCHIVE_PATH}" "${ARCHIVE_PATH}"
else
  curl -fsSL "${SOURCE_URL}" -o "${ARCHIVE_PATH}"
fi

ACTUAL_SHA256="$(sha256sum "${ARCHIVE_PATH}" | cut -d ' ' -f 1)"
if [[ "${ACTUAL_SHA256}" != "${SOURCE_SHA256}" ]]; then
  echo "Motion source checksum mismatch." >&2
  echo "Expected ${SOURCE_SHA256}" >&2
  echo "Received ${ACTUAL_SHA256}" >&2
  exit 1
fi

unzip -q "${ARCHIVE_PATH}" -d "${EXTRACT_DIR}"
SOURCE_DIR="${EXTRACT_DIR}/Animation Library[Standard]"
mkdir -p "${INSTALL_DIR}"
cp "${SOURCE_DIR}/Godot/AnimationLibrary_Godot_Standard.glb" "${MOTION_FILE}"
cp "${SOURCE_DIR}/License.txt" "${INSTALL_DIR}/LICENSE.txt"
echo "${MOTION_FILE}"
