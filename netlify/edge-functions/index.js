import { getStore } from '@netlify/blobs'

const rateLimitConfig = { maxUpdates: 3, timeSpan: 86400 }

export default async (_, context) => {
  // Create a unique identifier based on user's IP
  const identifier = 'limiter_' + context.ip
  // Get the visits store
  const visits = getStore('vists')
  const t = await visits.get(identifier)
  // If a key is found
  if (t) {
    // Get rate limit data for the key
    const { count_updates, last_update } = JSON.parse(t)
    // Calculate time difference in seconds
    const currentTime = new Date().getTime()
    const timeDifference = Math.floor((currentTime - new Date(last_update).getTime()) / 1000)
    // If time window has passed, reset count
    if (timeDifference >= rateLimitConfig.timeSpan) {
      await visits.set(identifier, JSON.stringify({ count_updates: 1, last_update: currentTime }))
      // Continue with your processing
      return new Response(`Reload 2 more times to exceed the rate limit.`)
    }
    // Check if the request count is below the limit
    if (count_updates < rateLimitConfig.maxUpdates) {
      // Increment the number of updates in the store
      await visits.set(identifier, JSON.stringify({ count_updates: count_updates + 1, last_update: new Date().getTime() }))
      // Continue with your processing
      return new Response(`Reload ${rateLimitConfig.maxUpdates - count_updates} more time(s) to exceed the rate limit.`)
    } else {
      // If the limits equal or exceeds, return with a rate limit exceeded message
      return new Response(`Rate limit exceeded.`)
    }
  } else {
    // If a key is not found, set the key with a single update and continue
    await visits.set(identifier, JSON.stringify({ count_updates: 1, last_update: new Date().getTime() }))
    return new Response(`Reload 2 more times to exceed the rate limit.`)
  }
}
