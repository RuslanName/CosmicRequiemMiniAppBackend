#!/bin/sh

MEM_LIMIT=""

if [ -f /sys/fs/cgroup/memory.max ]; then
  MEM_LIMIT_RAW=$(cat /sys/fs/cgroup/memory.max 2>/dev/null)
  if echo "$MEM_LIMIT_RAW" | grep -qE '^[0-9]+$'; then
    MEM_LIMIT=$((MEM_LIMIT_RAW / 1024 / 1024))
  fi
elif [ -f /sys/fs/cgroup/memory/memory.limit_in_bytes ]; then
  MEM_LIMIT_RAW=$(cat /sys/fs/cgroup/memory/memory.limit_in_bytes 2>/dev/null)
  if [ -n "$MEM_LIMIT_RAW" ] && [ "$MEM_LIMIT_RAW" != "9223372036854771712" ]; then
    MEM_LIMIT=$((MEM_LIMIT_RAW / 1024 / 1024))
  fi
fi

if [ -z "$MEM_LIMIT" ] || [ "$MEM_LIMIT" -le 0 ]; then
  if [ -f /proc/meminfo ]; then
    MEM_AVAILABLE=$(grep MemAvailable /proc/meminfo 2>/dev/null | awk '{print $2}' 2>/dev/null)
    if [ -z "$MEM_AVAILABLE" ]; then
      MEM_AVAILABLE=$(grep MemAvailable /proc/meminfo 2>/dev/null | tr -s ' ' | cut -d' ' -f2 2>/dev/null)
    fi
    if [ -n "$MEM_AVAILABLE" ] && [ "$MEM_AVAILABLE" -gt 0 ] 2>/dev/null; then
      MEM_LIMIT=$((MEM_AVAILABLE / 1024))
    fi
  fi
fi

if [ -z "$MEM_LIMIT" ] || [ "$MEM_LIMIT" -le 0 ]; then
  MEM_LIMIT=2048
  echo "Warning: Could not determine available memory, using default: ${MEM_LIMIT}MB"
fi

if [ "$MEM_LIMIT" -gt 4096 ]; then
  MEM_LIMIT=4096
fi

if [ -n "$NODE_MAX_OLD_SPACE_SIZE" ]; then
  NODE_MEMORY="$NODE_MAX_OLD_SPACE_SIZE"
  if [ "$NODE_MEMORY" -lt 512 ]; then
    NODE_MEMORY=512
  elif [ "$NODE_MEMORY" -gt 4096 ]; then
    NODE_MEMORY=4096
  fi
else
  NODE_MEMORY=$((MEM_LIMIT * 80 / 100))
  if [ "$NODE_MEMORY" -lt 512 ]; then
    NODE_MEMORY=512
  fi
  if [ "$NODE_MEMORY" -gt 4096 ]; then
    NODE_MEMORY=4096
  fi
fi

echo "Available memory: ${MEM_LIMIT}MB"
echo "Node.js heap limit: ${NODE_MEMORY}MB"

exec node --max-old-space-size="$NODE_MEMORY" dist/main.js

