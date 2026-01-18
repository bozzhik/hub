import {Elysia} from 'elysia'
import {html} from '@elysiajs/html'
import {projects} from '../data'
import {createLayout} from '../layout'

export const hubRoute = new Elysia().use(html()).get('/', ({html}) => {
  const projectsHtml = projects
    .map(
      (project) => `
        <article>
          <h3>
            ${project.status === 'prod' ? `<a href="https://${project.name}.wzx.cx">${project.name}</a>` : `${project.name} <small>🛠️</small>`}
          </h3>
          <p>${project.description}</p>
        </article>
      `,
    )
    .join('')

  return html(
    createLayout(
      'hub',
      `
          <header>
            <h1>bozzhik's hub</h1>
            <p>some projects under <strong>wzx.cx</strong></p>
          </header>

          <section>
            ${projectsHtml}
          </section>

          <footer>
            <p><em>visit <a href="https://bozzhik.com">bozzhik.com</a> to reach me</em></p>
          </footer>
          `,
    ),
  )
})
