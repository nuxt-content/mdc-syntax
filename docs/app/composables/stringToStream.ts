export function stringToStream(string: string, chunkSize = 10, delayMs = 50) {
  let controller: ReadableStreamDefaultController<Uint8Array> | null = null
  let timeoutId: NodeJS.Timeout | null = null
  let position = 0
  let isStreaming = false
  let isPaused = false

  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    start(ctrl) {
      controller = ctrl
    },
    cancel() {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      isStreaming = false
      isPaused = false
    },
  })

  const streamChunks = async () => {
    // If paused, schedule next check
    if (isPaused) {
      timeoutId = setTimeout(() => streamChunks(), 50)
      return
    }

    if (!controller || position >= string.length) {
      if (controller) {
        controller.close()
      }
      isStreaming = false
      return
    }

    isStreaming = true
    const chunk = string.slice(position, position + chunkSize)
    position += chunkSize

    controller.enqueue(encoder.encode(chunk))

    if (position < string.length) {
      timeoutId = setTimeout(() => streamChunks(), delayMs)
    }
    else {
      controller.close()
      isStreaming = false
    }
  }

  const start = () => {
    if (!isStreaming && position < string.length) {
      streamChunks()
    }
  }

  const pause = () => {
    isPaused = true
  }

  const resume = () => {
    if (isPaused) {
      isPaused = false
      // If we were streaming, continue
      if (isStreaming && position < string.length) {
        streamChunks()
      }
    }
  }

  const reset = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    position = 0
    isStreaming = false
    isPaused = false

    // Create a new stream
    return stringToStream(string, chunkSize, delayMs)
  }

  return {
    stream,
    start,
    pause,
    resume,
    reset,
    get isStreaming() {
      return isStreaming
    },
    get isPaused() {
      return isPaused
    },
    get progress() {
      return string.length > 0 ? position / string.length : 0
    },
    get bytesProcessed() {
      return position
    },
  }
}
