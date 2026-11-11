// Next.js reads NEXT_FONT_GOOGLE_MOCKED_RESPONSES in its own tests. With no network in the box, every
// Google Fonts request gets this one generic face, the same before and after the move.
module.exports = new Proxy({}, {
  get: (_, url) => typeof url === 'string' && url.startsWith('https://fonts.googleapis.com/')
    ? "@font-face { font-family: 'Mock'; font-style: normal; font-weight: 400; font-display: swap; src: url(https://fonts.gstatic.com/s/mock/v1/mock.woff2) format('woff2'); }"
    : undefined,
});
