import axios from 'axios'
import { Message } from 'element-ui'
import store from '@/store'
// import { getToken } from '@/utils/auth'

let networkErrorMsg = false
let invalidTokenMsg = false
const _Message = Message

// create an axios instance
const service = axios.create({
  baseURL: '/admin', // url = base url + request url
  // withCredentials: true, // send cookies when cross-domain requests
  timeout: 10000 // request timeout
})

// request interceptor
service.interceptors.request.use(
  config => {
    // do something before request is sent

    // jwt代替session，需要在头部携带token
    // if (store.getters.token) {
    //   // let each request carry token
    //   // ['X-Token'] is a custom headers key
    //   // please modify it according to the actual situation
    //   const token = getToken()
    //   config.headers['Authorization'] = token || ''
    // }

    config.headers['SupportWebp'] = store.getters.isSupportWebp ? 1 : 0

    return config
  },
  error => {
    // do something with request error
    console.log(error) // for debug
    return Promise.reject(error)
  }
)

// response interceptor
service.interceptors.response.use(
  /**
   * If you want to get http information such as headers or status
   * Please return  response => response
  */

  /**
   * Determine the request status by custom code
   * Here is just an example
   * You can also judge the status by HTTP Status Code
   */
  response => {
    const res = response.data

    // if the custom code is not 0, it is judged as an error.
    if (res.errno !== 0) {
      _Message({
        message: res.errmsg || 'error',
        type: 'error'
      })

      // 50008: Illegal token; 50012: Other clients logged in; 50014: Token expired;
      if (res.code === 401) {
        // to re-login
        if (!invalidTokenMsg) {
          invalidTokenMsg = true
          store.dispatch('user/logout').then(() => {
            _Message.error('登录状态已过期，请重新登录！')
            setTimeout(() => {
              location.reload()// 为了重新实例化vue-router对象 避免bug
            }, 1000)
          })
        }
      }
      return Promise.reject(res.errmsg || 'error')
    } else {
      return res
    }
  },
  error => {
    let message = '[err] ' + error
    console.log(message) // for debug

    if (message.includes('Request failed')) {
      message = '网络错误，请稍候重试'
    } else if (message.includes('timeout')) {
      message = '请求超时，请稍候重试'
    }

    if (!networkErrorMsg) {
      networkErrorMsg = true
      _Message.error(message || error.toString())
      setTimeout(() => {
        networkErrorMsg = false
      }, 2000) // duration = 2000ms
    }

    return Promise.reject(error)
  }
)

export default service
