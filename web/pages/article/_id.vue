<template>
  <div class="article">
    <!-- filter -->
    <el-form class="filter" label-width="40px" label-position="left">
      <el-form-item label="排序">
        <el-select v-model="filters.sortBy" placeholder="请选择排序方式" @change="handleSearch">
          <el-option label="更新时间" value="" />
          <el-option label="发布时间" value="addtime" />
          <el-option label="浏览次数" value="hits" />
        </el-select>
        <el-radio-group v-model="filters.orderBy" @change="handleSearch">
          <el-radio-button label="">降序</el-radio-button>
          <el-radio-button label="asc">升序</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="dynamicTags.length" label="标签">
        <el-tag
          v-for="tag in dynamicTags"
          :key="tag"
          closable
          size="medium"
          :disable-transitions="false"
          @close="handleDeleteTag(tag)"
        >{{ tag }}</el-tag>
      </el-form-item>
    </el-form>
    <!--article list-->
    <div class="article-list">
      <el-row
        v-for="(item, index) in articleList"
        :key="item.id"
        class="article-item"
        :class="index % 2 === 0 ? 'article-item--odd' : 'article-item--even'"
      >
        <el-col class="article-item-cover" :sm="24" :md="14">
          <nuxt-link :to="'/article/detail/' + item.id" :title="item.title">
            <img class="img-full" :src="item.imgurl" :alt="item.title">
          </nuxt-link>
        </el-col>
        <el-col class="article-item-info" :sm="24" :md="10">
          <p class="article-item-info__time">{{ item.updatetime | parseTime }}</p>
          <div class="article-item-info-title">
            <nuxt-link class="article-item-info__url" :to="'/article/detail/' + item.id" :title="item.title">{{ item.title }}</nuxt-link>
          </div>
          <p class="article-item-info__desc">{{ item.description }}</p>
          <div class="article-item-info-tags">
            <span
              v-for="(tag,childIndex) in item.tag"
              :key="childIndex"
              class="tl-tag"
              :class="tag | tagClassName"
              @click="handleAddTag(tag)"
            >{{ tag }}</span>
          </div>
          <div class="article-item-info-stuff">
            <span><i class="tl-icon">&#xe681;</i>{{ item.hits }}</span>
          </div>
        </el-col>
      </el-row>
      <!--list paper-->
      <div class="list-page">
        <pagination :total="total" :page.sync="listPage.page" :limit="listPage.pageSize" @pagination="changeListPage" />
      </div>
    </div>
  </div>
</template>

<script>
import Pagination from '@/components/Pagination'
import { listQuery, listPage, globalFilter } from '@/mixins'

export default {
  components: {
    Pagination
  },
  filters: {
    parseTime(time) {
      const monthEnum = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二']
      const dateTime = new Date(time)
      const year = dateTime.getFullYear()
      const month = dateTime.getMonth()
      const date = dateTime.getDate()
      return `${monthEnum[month]}月 ${date}, ${year}`
    }
  },
  mixins: [listQuery, listPage, globalFilter],
  async asyncData({ app, params, query, $axios }) {
    const paramId = params.id
    const [id, page] = paramId ? paramId.split('-') : []
    const { sortBy, orderBy, tags } = query
    const { seo, list } = await $axios.$get('/article/list', {
      params: {
        id: id === 'list' ? null : id,
        page,
        sortBy,
        orderBy,
        tags
      }
    })
    return {
      seo,
      listPage: {
        page: +page || 1,
        pageSize: list.pageSize
      },
      total: list.count,
      articleList: list.data,
      filters: {
        sortBy: sortBy || '',
        orderBy: orderBy || '',
        tags: tags || ''
      },
      dynamicTags: tags ? tags.split(',') : []
    }
  },
  head() {
    return {
      title: this.seo.title,
      meta: [
        { hid: 'description', name: 'description', content: this.seo.description },
        { hid: 'keyword', name: 'keyword', content: this.seo.keyword }
      ]
    }
  },
  watchQuery: ['sortBy', 'orderBy', 'tags']
}
</script>

<style lang="scss" scoped>
.article{
  &-item{
    position: relative;
    margin-bottom: 100px;
    &:last-child{
      margin-bottom: 0;
    }
    @media (max-width: 992px)  {
      margin-top: 30px;
    }
    &-cover{
      overflow: hidden;
      display: inline-block;
      float: none;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      &__picture{
        display: block;
        width: 100%;
      }
    }
    &-info{
      position: absolute;
      top: 50%;
      height: 400px;
      margin-top: -200px;
      padding: 70px 60px 0 60px;
      background-color: var(--bg-normal);
      border: 1px solid var(--border-color);
      @media (max-width: 992px) {
        position: static;
        height: auto;
        border: none;
      }
      @media (min-width: 992px) {
        height: 300px;
        margin-top: -150px;
      }
      @media (min-width: 1200px) {
        height: 360px;
        margin-top: -180px;
      }
      &__time{
        color: var(--color-secondary);
        font-size: 14px;
      }
      &-title{
        margin-top: 8px;
        font-size: 24px;
        line-height: 30px;
        word-break: break-all;
      }
      &__url{
        color: var(--color-main);
        &:hover{
          color: var(--color-primary);
        }
      }
      &__desc{
        margin-top: 10px;
        font-size: 15px;
        line-height: 22px;
      }
      &-stuff{
        position: absolute;
        bottom: 70px;
        left: 60px;
        color: var(--color-secondary);
        font-size: 14px;
        .tl-icon{
          margin-top: -2px;
          margin-right: 3px;
          font-size: 17px;
        }
      }
    }
    &--odd &-info{
      right: 0;
      border-left: none;
      border-top-right-radius: 6px;
      border-bottom-right-radius: 6px;
    }
    &--even{
      text-align: right;
    }
    &--even &-info{
      left: 0;
      border-right: none;
      border-top-left-radius: 6px;
      border-bottom-left-radius: 6px;
      text-align: left;
    }
  }
}
</style>
