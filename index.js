const setCache = (key, value) => ATTENDSYS.put(key, value);
const getCache = (key) => ATTENDSYS.get(key);

async function updateAttendance(request) {
  const body = await request.text();
  try {
    JSON.parse(body)
    await setCache("key", "value");
    return new Response(body, { status: 200 })
  } catch (err) {
    return new Response(err, { status: 500 });
  }
}

async function listAttendance(request) {
}

/**
 * Respond with hello worker text
 * @param {Request} request
 */
async function handleRequest(request) {
  if (request.method === "PUT") {
    return updateAttendance(request);
  }

  return new Response('Hello worker!', {
    headers: { 'content-type': 'text/plain' },
  })
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})