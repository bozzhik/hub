export interface Project {
  name: string
  description: string
  status: 'prod' | 'beta' | 'dev'
}

export const projects: Project[] = [
  {
    name: 'canvas',
    description: 'notion-like platform for portfolio, cv and other things',
    status: 'dev',
  },
  {
    name: 'slug',
    description: 'smart short link generator for something',
    status: 'dev',
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
