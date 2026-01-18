import {createLayout} from '@/layout'

import {Elysia} from 'elysia'
import {html} from '@elysiajs/html'

export default new Elysia().use(html()).get('/', ({html}) => {
  return html(
    createLayout(
      'hub',
      `
        <header>
          <h1>bozzhik's hub</h1>
          <p>some projects under <strong>wzx.cx</strong></p>
        </header>

        <footer>
          <p><em>visit <a href="https://bozzhik.com">bozzhik.com</a> to reach me</em></p>
        </footer>
        `,
    ),
  )
})
