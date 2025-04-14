<template>
    <span :style="`${this.preferenceStore.styleModalTextColor()}`">
        <a href="#" title="first page" class="first" :class="{ off: this.currentPage == 1 }" @click="firstPage()">
            <span class="material-icons pagination"
                :style="`${this.preferenceStore.styleModalTextColor()}`">keyboard_double_arrow_left</span>
        </a>
        <a href="#" title="previous page" class="prev" :class="{ off: this.currentPage == 1 }" @click="prevPage()">
            <span class="material-icons pagination"
                :style="`${this.preferenceStore.styleModalTextColor()}`">chevron_left</span>
        </a>
        <span class="pagination-label"> Page {{ currentPage }} of {{ !isNaN(Math.ceil(wcResults.results.numberOfRecords
            / wcLimit)) ? Math.ceil(wcResults.results.numberOfRecords / wcLimit) : "Last Page"}} </span>

        <a href="#" title="next page" class="next"
            :class="{ off: Math.ceil(wcResults.results.numberOfRecords / wcLimit) == this.currentPage }"
            @click="nextPage()">
            <span class="material-icons pagination"
                :style="`${this.preferenceStore.styleModalTextColor()}`">chevron_right</span>
        </a>
        <a href="#" title="last page" class="last"
            :class="{ off: Math.ceil(wcResults.results.numberOfRecords / wcLimit) == this.currentPage }"
            @click="lastPage()">
            <span class="material-icons pagination"
                :style="`${this.preferenceStore.styleModalTextColor()}`">keyboard_double_arrow_right</span>
        </a>
    </span>
</template>

<script>

import { usePreferenceStore } from '@/stores/preference'
import { mapStores, mapState, mapWritableState } from 'pinia'

export default{
    name: 'Pagination',
    props: {
        wcResults: Array,
        wcLimit: Number,
        currentPage: Number,
    },
    data(){
        return {
            newPage: null
        }
    },
    computed: {
        ...mapStores(usePreferenceStore),
        ...mapState(usePreferenceStore, ['styleDefault','panelDisplay']),
    },
    methods: {
        firstPage: function(){
          // if not the first page allow
          if (this.currentPage !== 1){
            this.newPage = 1
            this.$emit('emitCurrentPage', this.newPage)
          }
        },
        prevPage: function(){
          // if not the first page allow
          if (this.currentPage !== 1){
            this.newPage = this.currentPage - 1
            this.$emit('emitCurrentPage', this.newPage)
          }
        },

        nextPage: function(){
            let max = Math.ceil(this.wcResults.results.numberOfRecords / this.wcLimit)
            if (max > this.currentPage){
                this.newPage = this.currentPage + 1
                this.$emit('emitCurrentPage', this.newPage)
            }
        },
        lastPage: function(){
          let max = Math.ceil(this.wcResults.results.numberOfRecords / this.wcLimit)

          if (max > this.currentPage){
            this.newPage = max
            this.$emit('emitCurrentPage', this.newPage)
          }
        },
    }
}

</script>