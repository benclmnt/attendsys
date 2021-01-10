// DEBUG is an environment variable

async function updateAttendance(request) {
  try {
    const url = new URL(request.url);
    const formData = await request.formData()
    const nusnet = escapeHtml(formData.get('nusnet'))
    const name = escapeHtml(formData.get('name'))
    const now = new Date()
    const currDate = now.toLocaleDateString('en-GB', {
      timeZone: 'Asia/Singapore',
    }) // "dd/mm/yyyy",
    const currTime = now.toLocaleTimeString('en-GB', {
      timeZone: 'Asia/Singapore',
    }) // "hh:mm:ss"

    if (!DEBUG) {
      if (!isValidTimeRange(now) || !isValidDay(now)) {
        throw new Error('Sorry, currently this service is unavailable')
      }
    }

    let data = await getCache(nusnet)
    if (!data) {
      data = {
        name: [name],
        attendance: [],
      }
    } else {
      data = JSON.parse(data)
    }

    if (!data.attendance.find(x => x.date == currDate)) {
      data.attendance.push({
        date: currDate,
        time: currTime,
      })
      if (DEBUG) {
        console.log(JSON.stringify(data.attendance))
      }
    }

    await setCache(nusnet, JSON.stringify(data))

    // Redirect to /?name=${name}
    url.searchParams.append('name', name)
    return new Response(null, {
      status: 302,
      headers: { location: url.href },
    })
  } catch (err) {
    return new Response(err, { status: 500 })
  }
}

async function listAttendance(request) {}

/**
 * Respond with hello worker text
 * @param {Request} request
 */
async function handleRequest(request) {
  if (request.method === 'POST') {
    return updateAttendance(request)
  }

  const url = new URL(request.url)
  return new Response(form(url.searchParams.get('name')), {
    headers: { 'content-type': 'text/html' },
  })
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

/**
 * HELPER functions
 */

const escapeHtml = str => str.replace(/</g, '\\u003c')
const template = (body, script = '') => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="">
    <link rel="icon"
        href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🐰</text></svg>">
    <style>
    </style>
    <title>
        QR Code Attendance
    </title>
</head>
<body>
  ${body}
</body>
${script}
</html>
`
const form = name => {
  return name
    ? template(`Thankyou ${escapeHtml(name)} for attending!`,
`
<script>
history.pushState(null, null, "s");
window.addEventListener('popstate', function () {
    history.pushState(null, null, "s");
});
</script>
`)
    : template(`
<h1>Angklung Check-In</h1>
<form method="post">
    <label>Name</label>
    <input type="text" name="name">
    <label>NUSNET</label>
    <input type="text" name="nusnet">
    <input type="submit">
</form>
`)
}

const setCache = (key, value) => ATTENDSYS.put(key, value)
const getCache = key => ATTENDSYS.get(key)

const isValidTimeRange = datetime => {
  const hr = datetime.getHours()
  const min = datetime.getMinutes()
  // 18.30 - 20.59
  if (hr < 18 || hr > 21) return false
  if (hr == 19 || hr == 20) return true
  if (min < 30) return false
}

const isValidDay = datetime => {
  const day = datetime.getDay()
  return day == 1 || day == 3
}
