import qrcode from 'qr.js'
// DEBUG is an environment variable

const UNIQUE_CODE = "$CODE";
const VALID_KEY = "$VALID_KEY";

async function updateAttendance(request) {
  try {
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

    const url = new URL(request.url)
    const formData = await request.formData()
    const nusnet = escapeHtml(formData.get('nusnet').toUpperCase())
    const name = escapeHtml(formData.get('name'))
    const code = escapeHtml(formData.get(UNIQUE_CODE))

    if (code !== (await getCache(UNIQUE_CODE))) {
      throw new Error('Whatcha tryna to do?!')
    }

    if (!(await getCache(VALID_KEY)).includes(nusnet)) {
      return redirect(url.href)
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

    // can only checkin once per day.
    if (!data.attendance.find(x => x.date == currDate)) {
      data.attendance.push({
        date: currDate,
        time: currTime,
      })
      await setCache(nusnet, JSON.stringify(data))
      if (DEBUG) {
        console.log(JSON.stringify(data.attendance))
      }
    }

    // Redirect to /?name=${name}
    url.searchParams.append('name', name)
    return redirect(url.href)
  } catch (err) {
    return new Response(err, { status: 500 })
  }
}

async function listAttendance(request) {
  try {
    const url = new URL(request.url)
    const formData = await request.formData()
    const pswd = escapeHtml(formData.get('pswd'))

    if (pswd !== ADMIN_PSWD) {
      return redirect(url.href)
    }

    let { keys } = await listCache()
    keys = keys.filter(key => ![UNIQUE_CODE, VALID_KEY].includes(key.name))
    const promises = []
    for (let key of keys) {
      promises.push(getCache(key.name))
    }

    const results = await Promise.allSettled(promises)
    const data = []
    for (let i = 0; i < results.length; i++) {
      if (results[i].status === 'rejected') continue
      data.push({
        nusnet: keys[i].name,
        ...JSON.parse(results[i].value),
      })
    }

    return new Response(listTemplate(JSON.stringify(data)), {
      headers: { 'content-type': 'text/html' },
    })
  } catch (err) {
    return new Response(err, { status: 500 })
  }
}

async function generateQRCode(request) {
  const url = new URL(request.url)
  const cells = qrcode(url.host).modules
  return new Response(qrTemplate(cells), {
    headers: { 'content-type': 'text/html' },
  })
}

/**
 * Respond with hello worker text
 * @param {Request} request
 */
async function handleRequest(request) {
  const url = new URL(request.url)

  if (request.method === 'POST') {
    if (url.pathname === '/list') {
      return listAttendance(request)
    }
    return updateAttendance(request)
  }

  if (url.pathname === '/qr') {
    return generateQRCode(request)
  } else if (url.pathname === '/list') {
    return new Response(adminTemplate(), {
      headers: { 'content-type': 'text/html' },
    })
  }

  return new Response(await formTemplate(url.searchParams.get('name')), {
    headers: { 'content-type': 'text/html' },
  })
}

async function handleScheduled(scheduledTime) {
  return setCache(UNIQUE_CODE, uid())
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

addEventListener('scheduled', event => {
  // event.waitUntil takes in a promise
  event.waitUntil(handleScheduled(event.scheduledTime))
})

/**
 * Template functions
 */

const escapeHtml = str => str.replace(/</g, '\\u003c')
const template = (body, script = '') => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="">
    <link rel="icon" href="https://nusangklung.netlify.app/favicon.jpg">
    <link href="https://unpkg.com/tailwindcss@^2/dist/tailwind.min.css" rel="stylesheet">
    <title>
        Attendance System
    </title>
</head>
<body>
  ${body}
</body>
${script}
</html>
`
const formTemplate = async (name, err) => {
  if (name) {
    return template(
      `
<div class="min-h-screen flex items-center justify-center bg-green-300 py-12 px-4 sm:px-6 lg:px-8">
  <h2 class="mt-6 text-center text-xl text-gray-900">
      Thankyou <span class="font-bold">${escapeHtml(name)}</span> for attending!
  </h2>
</div>
`,
      `
<script>
history.pushState(null, null, "s");
window.addEventListener('popstate', function () {
    history.pushState(null, null, "s");
});
</script>
`,
    )
  }

  const secret = await getCache(UNIQUE_CODE)
  return template(`
<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
  <div>
    <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
      Angklung Check-In
    </h2>
  <div>
  <form class="mt-8 space-y-6" method="post">
    <div>
      <label class="sr-only">Name</label>
      <input type="text" name="name" placeholder="Full Name" required class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm">
    </div>
    <div>
      <label class="sr-only">NUSNET</label>
      <input type="text" name="nusnet" placeholder="NUSNET id" required class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm">
    </div>
      <input type="hidden" name="${UNIQUE_CODE}" value="${secret}">
    <div>
      <button type="submit" class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
        Check in
      </button>
    </div>
  </form>
</div>
`)
}

const qrTemplate = cells =>
  template(
    `
<div id="qr" class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
</div>
`,
    `
<script>
const width = 320;
const height = 320;

const canvas = document.createElement('canvas');
canvas.width = width;
canvas.height = height;

const ctx = canvas.getContext('2d');

const cells = ${JSON.stringify(cells)};

const tileW = width  / cells.length;
const tileH = height / cells.length;

for (let r = 0; r < cells.length ; ++r) {
    const row = cells[r];
    for (let c = 0; c < row.length ; ++c) {
        ctx.fillStyle = row[c] ? '#000' : '#fff';
        const w = (Math.ceil((c+1)*tileW) - Math.floor(c*tileW));
        const h = (Math.ceil((r+1)*tileH) - Math.floor(r*tileH));
        ctx.fillRect(Math.round(c*tileW), Math.round(r*tileH), w, h);
    }
}
document.querySelector("#qr").appendChild(canvas);
</script>
  `,
  )

const adminTemplate = () =>
  template(
    `
</form>
<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
  <div>
    <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
      👀
    </h2>
  <div>
  <form class="mt-8 space-y-6" method="post">
    <div>
      <label class="sr-only">Password</label>
      <input type="password" autocomplete="password" name="pswd" required class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm">
    </div>
    <div>
      <button type="submit" class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
        Submit
      </button>
    </div>
  </form>
</div>
`,
  )

const listTemplate = data =>
  template(
    `
<button id="export" class="w-full py-2 px-4 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
    Export
</button>
<div class="flex flex-col">
  <div class="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
    <div class="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
      <div class="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
        <table class="table-auto" id="table-attendance">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NUSNET</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>
`,
    `
<script>
const data = ${data};
const dates = []
data.map(x => x.attendance).forEach(y => {
  y.forEach(z => {
    const date = z.date.slice(0, 5) // only take dd/mm
    if(!dates.includes(date)) {
      dates.push(date);
    }
  })
})

dates.sort((a,b) => Number(a.slice(0, 2)) - Number(b.slice(0, 2)))
dates.sort((a,b) => Number(a.slice(3)) - Number(b.slice(3)))

const thead = document.querySelector('table thead tr');
for (let date of dates) {
  const th = document.createElement('th');
  th.scope = "col"
  th.textContent = date;
  th.style.cssText = "width: 50px;"
  th.classList.add(...("px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider".split(" ")))
  thead.appendChild(th);
}

const tbody = document.querySelector('table tbody');
for (let x of data) {
  const tr = document.createElement('tr');

  const nusnet = document.createElement('td');
  nusnet.classList.add(...("px-6 py-4 whitespace-nowrap").split(" "))
  nusnet.textContent = x.nusnet;
  tr.appendChild(nusnet);

  const name = document.createElement('td');
  name.classList.add(...("px-6 py-4 whitespace-nowrap").split(" "))
  name.textContent = x.name;
  tr.appendChild(name);

  const attendance = new Map();
  x.attendance.forEach(y => {
    attendance.set(y.date.slice(0, 5), y.time.slice(0, 5))
  })
  dates.forEach(date => {
    const tile = document.createElement('td');
    tile.classList.add(...("px-6 py-4 whitespace-nowrap").split(" "))
    if (attendance.has(date)) {
      tile.textContent = attendance.get(date)
    }
    tr.appendChild(tile);
  })
  tbody.appendChild(tr);
}
</script>
<script src=
"//ajax.googleapis.com/ajax/libs/jquery/2.2.4/jquery.min.js">
</script>
<script src=
"//cdn.rawgit.com/rainabba/jquery-table2excel/1.1.0/dist/jquery.table2excel.min.js">
</script>
<script>
  $("#export").click(function() {
    $("#table-attendance").table2excel({
        name: "Angklung attendance list",
        filename: "attendance-" + new Date().toISOString().slice(0, 10)
    });
  });
</script>
`,
  )

/**
 * KV functions
 */

const setCache = (key, value) => KV.put(key, value)
const getCache = key => KV.get(key)
const listCache = () => KV.list()

/**
 * Util functions
 */

const isValidTimeRange = datetime => {
  const hr = datetime.getHours()
  const min = datetime.getMinutes()
  // 18.30 - 20.59
  if (hr < 18 || hr > 21) return false
  if (hr == 19 || hr == 20) return true
  if (min < 30) return false
}

// only monday and wednesday
const isValidDay = datetime => {
  const day = datetime.getDay()
  return day == 1 || day == 3
}

// https://gist.github.com/gordonbrander/2230317#gistcomment-3404537
function uid() {
  return (
    String.fromCharCode(Math.floor(Math.random() * 26) + 97) +
    Math.random()
      .toString(16)
      .slice(2) +
    Date.now()
      .toString(16)
      .slice(4)
  )
}

const redirect = location => {
  return new Response(null, {
    status: 302,
    headers: { location },
  })
}
