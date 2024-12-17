<template>
    <VueFinalModal
        display-directive="show"
        :hide-overlay="true"
        :overlay-transition="'vfm-fade'"
        @closed="closeModal()"
      >
        <VueDragResize
            :is-active="true"
            :w="850"
            :h="400"
            :x="200"
            :y="50"
            :class="ddc-modal"
            @resizing="dragResize"
            @dragging="dragResize"
            :sticks="['br']"
            :stickSize="22"
            style="background-color: whitesmoke"
            >

            <div class="dewey-modal" @mousedown="onSelectElement($event)" @touchstart="onSelectElement($event)">
                <div>
                    <div class="dewey-menu-button">
                        <button @click="closeModal()" class="close-button">Close</button>
                    </div>
                </div>
                <div ref="autoDeweyModalContainer" class="auto-dewey-modal-container">
                    <h1 style="margin-left: 5px">LC to DDC</h1>
                    <div class="auto-dewey-container">
                        <div class="input-panel">
                            <label for="LcCall">LC Call Number: </label>
                            <input class="lcCallInput" name="LcCall" v-model="lcCall" ref="inputLookup" type="text" @click="inputFocus" />

                            <div class="dewey-toggle-btn-grp cssonly" style="margin-bottom: 8px;">
                                <div><span class="dewey-genre">Genre:</span></div>
                                <div v-for="opt in autoDeweyGenres">
                                    <input type="radio" :id="opt" :value="opt" class="genre-type-radio" v-model="autoDeweyGenre" name="genre-selection" />
                                    <label onclick="" :for="opt" class="dewey-toggle-btn">{{opt}}</label>
                                </div>
                            </div>

                            <button @click="dewIt()" style="margin-top: 8px;">Create DDC</button>

                            <div v-if="deweyInfo && deweyInfo.periods && deweyInfo.periods.length > 0" style="margin-top: 10px;" class="dewey-period-selection">
                                Select a period to complete the DDC creation.
                                <div class="dewey-toggle-btn-grp cssonly">
                                    <div v-for="(per, idx) in deweyInfo.periods">
                                        <input type="radio" :id="per" :value="per" class="period-type-radio" v-model="deweyPeriod" name="period-selection" @click="setPeriod($event, idx)" />
                                        <label onclick="" :for="per" class="dewey-toggle-btn">{{per}}</label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="auto-dewey-results">
                            <h2>Results</h2>
                            <dl v-if="deweyInfo">
                                <div v-for="(value, name, indx) in deweyInfo">
                                    <dt v-if="value">{{ name }}</dt>
                                    <dd v-if="value">{{ value }}</dd>
                                </div>
                                <!--

                                <dt>DDC Caption</dt>
                                <dd>{{ deweyInfo['DDC Caption'] }}</dd>

                                <dt>LCC Caption</dt>
                                <dd>{{ deweyInfo['LCC Caption'] }}</dd> -->
                            </dl>
                            <button @click="add()" v-if="deweyInfo && deweyData.lcc && this.$route.path.includes('/edit/')">Add to record</button>
                        </div>
                    </div>
                </div>
            </div>
        </VueDragResize>
    </VueFinalModal>
  </template>


  <style type="text/css" scoped>
    dt {
        font-weight: bold;
    }

    dl,
    dd {
        font-size: 0.9rem;
    }

    dd {
        margin-bottom: 1em;
        margin-left: 2em;
    }

    .dewey-modal{
        background-color: whitesmoke;
    }

    .auto-dewey-container {
        display: flex;
    }

    .auto-dewey-modal-container{
        height: 400px;
    }

    .input-panel{
        width:50%;
        padding: 10px;
    }

    .auto-dewey-results {
        width: 50%;
        background-color: lightgrey;
        margin: 5px;
        padding: 5px;
    }

    .dewey-genre {
        line-height: 30px;
    }

    .dewey-toggle-btn-grp.cssonly{
        width: 100%;
        height: 30px;
        line-height: 30px;

        display: flex;
        flex-direction: row;
        flex-wrap: wrap
    }
    .dewey-toggle-btn-grp.cssonly div {
        display: initial;
        position: relative;
        margin: 5px 2px;
    }
    /* .dewey-toggle-btn-grp {
        display: flex;
        position: relative;
        margin: 5px 2px;
    } */

    .dewey-toggle-btn-grp div {
        margin: 5px;
        padding: 5px;
        width: fit-content;
    }

    .period-type-radio,
    .genre-type-radio {
        position: absolute;
        z-index: 100;
        cursor: pointer;
        opacity: 0;
    }

    .dewey-toggle-btn-grp.cssonly div input{
        padding: 5px;
    }

    .dewey-toggle-btn-grp.cssonly div label:hover {
        border: solid 1px #a0d5dc !important;
    }

    .dewey-toggle-btn-grp.cssonly div input + label{
        border: solid 1px black;
        border-radius: 5px;
        padding: 5px;
    }

    .dewey-toggle-btn-grp.cssonly div input:checked + label{
        background-color: lightblue;
        border: solid 1px blue;
        border-radius: 5px;
    }

    .dewey-toggle-btn {
        cursor: pointer;
    }

    .dewey-menu-buttons{
        float: right;
        margin: 5px;
    }

    .dewey-period-selection{
        max-width: 100%;
    }

    .close-button{
        position: absolute;
        right: 5px;
        top: 5px;
        background-color: white;
        border-radius: 5px;
        border: solid 1px black;
        cursor: pointer;
        z-index: 100;
    }

  </style>

  <script>
    import { VueFinalModal } from 'vue-final-modal'
    import VueDragResize from 'vue3-drag-resize'
    import { onPeriodClicked, LcCallToDewey } from '@/lib/auto_dewey'
    import { mapStores, mapState, mapWritableState } from 'pinia'
    import { useProfileStore } from '@/stores/profile'

    export default {
    name: "AutoDewey",
    components: {
        VueFinalModal,
        VueDragResize,
    },

    watch: {},

    data: function() {
        return {
            autoDeweyGenres: ['none', 'fiction', 'poetry', 'drama'],
            autoDeweyGenre: 'none',
            lcCall: null,
            deweyInfo: null,
            deweyPeriod: 0,
            guid: null,
            structure: null,
        }
    },

    computed: {
        ...mapStores(useProfileStore),
        ...mapWritableState(useProfileStore, ['showAutoDeweyModal','deweyData']),
    },
    methods: {
        dragResize: function(newRect) {
            this.width = newRect.width
            this.height = newRect.height
            this.top = newRect.top
            this.left = newRect.left
            this.$refs.shelfListingContent.style.height = newRect.height + 'px'
        },
        inputFocus: function(){
            this.$refs.inputLookup.focus()
        },
        closeModal: function(){
            this.autoDeweyGenre = null
            this.lcCall = null
            this.deweyInfo = null
            this.deweyData.guid = null
            this.deweyData.structure = null
            this.showAutoDeweyModal = false
        },

        dewIt: function(){
            this.deweyInfo = LcCallToDewey(this.lcCall, this.autoDeweyGenre)
        },

        add: function(){
            this.profileStore.addDdc(this.deweyInfo, this.deweyData.guid, this.deweyData.structure)
            this.closeModal()
        },

        setPeriod: function(e, idx){
            const period = this.deweyInfo.dewey
            if (period.startsWith("Period")){
                this.savedPeriod = period
            }
            const genre = this.deweyInfo.genre
            const country = this.deweyInfo.country
            let result = onPeriodClicked(idx+1, this.savedPeriod, genre, country) //periodNumber, sDewey$, sGenre$, sCountry$

            this.deweyInfo.dewey = result
        },

        onSelectElement (event) {
          const tagName = event.target.tagName

          if (tagName === 'INPUT' || tagName === 'TD' || tagName === 'BUTTON'  || tagName === 'TEXTAREA' || tagName === 'SELECT') {
            event.stopPropagation()
          }
        },
    },

    created: function () {},
    before: function () {},
    mounted: function(){
        this.lcCall = this.deweyData.lcc
        this.guid = this.deweyData.guid
        this.structure = this.deweyData.structure
    },


    updated: function() {}
  };

  </script>