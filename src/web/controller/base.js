const isDev = think.env === 'development'

module.exports = class extends think.Controller {
  constructor(...arg) {
    super(...arg)
    this.siteurl = ''
    this.title = ''
    this.options = null
    this.category = null
  }

  async __before() {
    // 配置信息
    this.siteurl = this.ctx.origin.replace(/http:|https:/, '')

    this.getConfigs()
    this.getCategory()
  }

  async getConfigs() {
    this.options = await this.model('config').getConfig()

    // SEO
    switch (this.options.seo_title_type) {
      case '1':
        this.title = ''
        break
      case '2':
        this.title = ` - ${this.options.keywords}`
        break
      case '3':
        this.title = ` - ${this.options.sitename}`
        break
      case '4':
        this.title = ` - ${this.options.keywords} | ${this.options.sitename}`
        break
    }
  }

  // 主导航信息
  async getCategory() {
    const allColumns = await this.model('column').getCategory()
    this.category = this.formatNavigation(allColumns)
  }

  formatNavigation(categorys) {
    categorys.forEach(item => {
      const { id, folderName, filename, classtype, type } = item
      let path = ''
      if (think.isEmpty(filename)) {
        switch (type) {
          case 5:
            path = classtype === 1 ? '' : id
            break
          case 7:
            path = ''
            break
          default:
            path = classtype === 1 ? '' : id
        }
      } else {
        path = `${filename}`
      }
      item.url = `/${folderName}/${path}`
    })
    return categorys
  }

  /**
   * 二维数组转树形数组
   * @param {Array} data 原二维数组
   * @param {Number} parentid 父节点id
   * @returns {Array} 树形数组 [{id:1,children:[{id:2},{id:3,children:[{id:4}]}]}]
   */
  convertToTree(data, parentid = 0) {
    const tree = []
    let temp
    for (let i = 0; i < data.length; i++) {
      if (data[i].parentid === parentid) {
        const obj = data[i]
        temp = this.convertToTree(data, data[i].id)
        if (temp.length > 0) {
          obj.children = temp
        }
        tree.push(obj)
      }
    }
    return tree
  }

  /**
   * 设置列表页公共信息
   * @param {Number} Id 期望栏目id
   */
  getListInfo(Id) {
    let category
    // 当前栏目
    if (think.isEmpty(Id)) {
      const path = this.ctx.path
      category = this.category.find(item => item.classtype === 1 && path.indexOf(item.folderName) > -1)
    } else {
      category = this.category.find(item => item.id === +Id)
    }

    if (!category) {
      return null
    }

    // meta信息
    const { name: title, keywords, description } = category
    const seo = {
      title: title + this.title,
      keywords,
      description
    }

    return {
      category,
      seo
    }
  }

  /**
   * 获取详情的栏目以及seo信息
   * @param {Object} content 详情
   */
  getDetailInfo(content) {
    const { title, keywords, description, category_id } = content

    // meta信息
    const category = this.category.find(item => item.id === category_id)
    const { keywords: columnKeywords, description: columnDescription } = category

    const seo = {
      title: title + this.title,
      keywords: keywords || columnKeywords,
      description: description || columnDescription
    }

    return {
      category,
      seo
    }
  }

  /**
   * 裁剪图片
   * @param {Number} width 目标图片宽度.
   * @param {Number} height 目标图片高度
   * @param {Number} fit 裁剪方式
   * @param {Object} options 目标图片输出参数
   */
  async thumbImage(src, width, height, fit = 0, options = {}) {
    if (think.isEmpty(src)) {
      src = '/static/placeholder.png'
    }
    const isSupportWebp = this.ctx.headers.supportwebp
    const dest = await think.sharpResize(src, {
      width: +width,
      height: +height,
      fit: +fit
    },
    {
      format: +isSupportWebp ? 'webp' : 'jpg',
      ...options
    })

    return isDev ? dest : `${dest ? '//cdn.timelessq.com' + dest : ''}`
  }

  /**
   * 转换图片为webp
   * @param {String} src
   */
  async convertToWebp(src) {
    if (think.isEmpty(src)) return ''

    const isSupportWebp = this.ctx.headers.supportwebp
    const dest = await think.sharpFormat(src, {
      format: +isSupportWebp ? 'webp' : 'jpg'
    })

    return isDev ? dest : `${dest ? '//cdn.timelessq.com' + dest : ''}`
  }

  /**
   * 文章内图片转换成webp格式
   * @param {String} str 文章内容
   * @returns {String}
   */
  async compressContent(content) {
    const isSupportWebp = this.ctx.headers.supportwebp
    if (+isSupportWebp) {
      const contentImages = content.match(/<img[^>]+>/g) || []
      const temp = []
      contentImages.forEach((item) => {
        item.replace(/<img [^>]*src=['"]([^'"]+)[^>]*>/gi, (match, capture) => {
          if (capture.includes('upload')) { temp.push(capture) }
        })
      })
      for (let i = 0; i < temp.length; i++) {
        const src = temp[i]
        if (think.isEmpty(src)) continue

        const dest = await think.sharpFormat(src, {
          format: +isSupportWebp ? 'webp' : 'jpg'
        })
        const fileUrl = isDev ? dest : `${dest ? '//cdn.timelessq.com' + dest : ''}`
        if (dest) { content = content.replace(src, fileUrl) }
      }
    }

    return content
  }

  /**
   * 截取字符串
   * @param {Number [int]} index 开始下标
   * @param {Number [int]} length 截取长度
   */
  substr(str, index, length) {
    return str.substr(index, length)
  }

  __cell() {
    return this.ctx.throw(404)
  }
}
