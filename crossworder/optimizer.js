export function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const FIRST_RUN = {}

export function Optimizer({ seconds, onProgress = () => {} }) {
  return async function (algo) {
    var start = Date.now()
    var best = FIRST_RUN
    var bestScore = 0
    onProgress(0)
  
    while(true) {
      var candidate = await algo()
      var score = candidate.score()
      if (best === FIRST_RUN || score > bestScore) {
        best = candidate
        bestScore = score
      }
      var progress = (Date.now() - start) / (1+1000*seconds)
      if (progress < 1) {
        onProgress(progress)
        await timeout(0)
      } else {
        onProgress(1)
        return best
      }
    }
  }
}
