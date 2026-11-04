#!/bin/bash
# Render a clip with N parallel headless Blender workers (interleaved frames) and wait for all.
#   bash state_of_ai/src/blender/render_clip.sh <clip> [workers] [extra args passed to the script]
CLIP=$1
N=${2:-2}
shift 2
DIR=$(cd "$(dirname "$0")" && pwd)
mkdir -p "$DIR/_logs"
for ((k = 0; k < N; k++)); do
  /usr/bin/blender -b --factory-startup -P "$DIR/$CLIP.py" -- --part "$k/$N" "$@" \
    > "$DIR/_logs/${CLIP}_part$k.log" 2>&1 &
done
wait
grep -h "TIMING" "$DIR/_logs/${CLIP}_part"*.log
echo "frames on disk: $(ls "$DIR/_frames/$CLIP" | wc -l)"
