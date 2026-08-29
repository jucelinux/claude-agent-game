#!/usr/bin/env bash
set -euo pipefail

BLENDER_VERSION="5.2.1"
BLENDER_RELEASE="5.2"
BLENDER_PLATFORM="linux-x64"
BLENDER_SHA256="a31f524fa99a527d3d52b7f5aaa68c34e1a19d5a1c9473f79c5cc610fd5b10e9"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
TOOLS_DIR="${PROJECT_DIR}/.tools"
ARCHIVE_NAME="blender-${BLENDER_VERSION}-${BLENDER_PLATFORM}.tar.xz"
INSTALL_DIR="${TOOLS_DIR}/blender-${BLENDER_VERSION}-${BLENDER_PLATFORM}"
BLENDER_BIN="${INSTALL_DIR}/blender"
DOWNLOAD_URL="https://download.blender.org/release/Blender${BLENDER_RELEASE}/${ARCHIVE_NAME}"

if [[ "$(uname -s)" != "Linux" || "$(uname -m)" != "x86_64" ]]; then
  echo "The pinned Blender bootstrap currently supports Linux x86_64 only." >&2
  exit 1
fi

if [[ -x "${BLENDER_BIN}" ]]; then
  "${BLENDER_BIN}" --version | head -1
  exit 0
fi

mkdir -p "${TOOLS_DIR}"
ARCHIVE_PATH="$(mktemp "${TOOLS_DIR}/.${ARCHIVE_NAME}.XXXXXX")"
EXTRACT_DIR="$(mktemp -d "${TOOLS_DIR}/.blender-extract.XXXXXX")"

cleanup() {
  rm -f "${ARCHIVE_PATH}"
  rm -rf "${EXTRACT_DIR}"
}
trap cleanup EXIT

echo "Preparing Blender ${BLENDER_VERSION} LTS..."
if [[ -n "${BLENDER_ARCHIVE_PATH:-}" ]]; then
  cp "${BLENDER_ARCHIVE_PATH}" "${ARCHIVE_PATH}"
else
  curl -fsSL "${DOWNLOAD_URL}" -o "${ARCHIVE_PATH}"
fi

ACTUAL_SHA256="$(sha256sum "${ARCHIVE_PATH}" | cut -d ' ' -f 1)"
if [[ "${ACTUAL_SHA256}" != "${BLENDER_SHA256}" ]]; then
  echo "Blender checksum mismatch." >&2
  echo "Expected ${BLENDER_SHA256}" >&2
  echo "Received ${ACTUAL_SHA256}" >&2
  exit 1
fi

tar -xf "${ARCHIVE_PATH}" -C "${EXTRACT_DIR}"
mv "${EXTRACT_DIR}/blender-${BLENDER_VERSION}-${BLENDER_PLATFORM}" "${INSTALL_DIR}"
"${BLENDER_BIN}" --version | head -1
