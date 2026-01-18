export interface Project {
  name: string
  description: string
  status: 'prod' | 'beta' | 'dev'
}

export const projects: Project[] = [
  {
    name: 'canvas',
    description: 'notion-like editor for portfolio, CV and personal website',
    status: 'dev',
  },
  {
    name: 'slug',
    description: 'smart short link generator for something',
    status: 'dev',
  },
  {
    name: 'zero',
    description: 'minimal classless CSS framework inspired by shadcn.com',
    status: 'prod',
  },
  {
    name: 'snable',
    description: 'chrome extension for collecting visual elements from websites',
    status: 'prod',
  },
]

export const getActiveProjects = () => {
  return projects.filter((project) => project.status === 'prod')
}
