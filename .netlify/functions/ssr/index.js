const path = require('path')
const StorefrontRouter = require('@ecomplus/storefront-router')

process.env.NODE_ENV = 'production'
process.env.STOREFRONT_BASE_DIR = __dirname
process.env.STOREFRONT_BUNDLES_PATH = path.join(`${__dirname}/bundles.json`)

exports.handler = (ev, context, callback) => {
  if (/^\/(storefront|checkout)\.[^.]+\.(js|css)$/.test(ev.path)) {
    const [filename, , ext] = ev.path.split('.')
    return callback(null, {
      statusCode: 301,
      headers: {
        Location: `${filename}.${ext}`
      }
    })
  }

  if (/\.(js|css|ico|png|gif|jpg|jpeg|webp|svg|woff|woff2|otf|ttf|eot)$/.test(ev.path)) {
    return callback(null, {
      statusCode: 404,
      headers: {
        'Cache-Control': 'public, max-age=60'
      }
    })
  }

  let statusCode = 200
  const headers = {}

  const req = {
    url: ev.path.charAt(0) === '/' ? ev.path : `/${ev.path}`
  }

  const storeId = require(path.join(path.resolve(process.env.STOREFRONT_BASE_DIR, 'content'), 'settings.json')).store_id
  const router = new StorefrontRouter(storeId)

  router.list()
    .then(routes => {
      router.map(req.url).then(route => {
        callback(null, { statusCode, headers, body: JSON.stringify({ req, routes, route }, null, 2) })
      })
    })
  return

  const res = {
    set (header, value) {
      headers[header] = value
      return res
    },
    status (status) {
      statusCode = status
      return res
    },
    end () {
      callback(null, { statusCode, headers })
      return res
    },
    send (body) {
      callback(null, { statusCode, headers, body })
      return res
    }
  }

  const { ssr } = require('@ecomplus/storefront-renderer/functions/')
  ssr(req, res)
}
