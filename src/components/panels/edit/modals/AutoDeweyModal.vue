<template>
    <VueFinalModal
        display-directive="show"
        :hide-overlay="false"
        :overlay-transition="'vfm-fade'"
        @closed="closeModal()"
      >
        <VueDragResize
            :is-active="true"
            :w="850"
            :h="250"
            :x="initalLeft"
            :y="50"
            class="debug-modal"
            @resizing="dragResize"
            @dragging="dragResize"
            :sticks="['br']"
            :stickSize="22"
            >

            <div class="complex-lookup-modal">
                <div style="position: relative;">
                    <div class="dewey-menu-button">
                        <button @click="closeModal()">Close</button>
                    </div>
                </div>
                <div ref="autoDeweyModalContainer" class="auto-dewey-modal-container">
                    <h1 style="margin-left: 5px">AutoDewey 🤖</h1>
                    <div class="auto-dewey-container">
                        <div class="input-panel">
                            <label for="LcCall">LC Call Number: </label>
                            <input class="lcCallInput" name="LcCall" v-model="lcCallLocal" ref="inputLookup" type="text" @click="inputFocus" />

                            <div class="dewey-toggle-btn-grp cssonly" style="margin-bottom: 8px;">
                                <div v-for="opt in autoDeweyGenres">
                                    <input type="radio" :id="opt" :value="opt" class="genre-type-radio" v-model="autoDeweyGenre" name="genre-selection" />
                                    <label onclick="" :for="opt" class="dewey-toggle-btn">{{opt}}</label>
                                </div>
                            </div>

                            <button @click="dewIt()">Create DDC</button>

                            <div v-if="deweyInfo && deweyInfo.periods && deweyInfo.periods.length > 0" style="margin-top: 10px;">
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

                            <button @click="add()" v-if="deweyInfo">Add to record</button>
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

    .auto-dewey-modal-container{

    }

    .auto-dewey-container {
        display: flex;
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
    .dewey-toggle-btn-grp.cssonly{
        width: 500px;
        height: 30px;
        line-height: 30px;
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

  </style>

  <script>
    import { VueFinalModal } from 'vue-final-modal'
    import VueDragResize from 'vue3-drag-resize'
    import { onPeriodClicked, LcCallToDewey } from '@/lib/auto_dewey'

    export default {
    name: "AutoDewey",
    components: {
        VueFinalModal,
        VueDragResize,
    },
    props: {
        lcCall: String,
    },

    watch: {},

    data: function() {
        return {
            autoDeweyGenres: ['fiction', 'poetry', 'drama'],
            autoDeweyGenre: null,
            lcCallLocal: null,
            deweyInfo: null,
            deweyPeriod: 0,
        }
    },

    computed: {},
    methods: {
        inputFocus: function(){
            this.$refs.inputLookup.focus()
        },
        closeModal: function(){
            this.autoDeweyGenre = null
            this.lcCallLocal = null
            this.deweyInfo = null
            this.$emit('hideDeweyModal', true)
        },

        dewIt: function(){
            console.info("Dewing the thing")
            console.info("genre: ", this.autoDeweyGenre)
            console.info("lcCall: ", this.lcCallLocal)
            this.deweyInfo = LcCallToDewey(this.lcCallLocal, this.autoDeweyGenre)
            console.info(">>> deweyInfo", this.deweyInfo)
        },

        add: function(){
            console.info("adding to record")
            this.$emit('addDdc', this.deweyInfo)
            this.closeModal()
        },

        setPeriod: function(e, idx){
            console.info("setting period: ", this.deweyInfo, "--", idx)
            //e.target.checked = true
            const period = this.deweyInfo.dewey
            if (period.startsWith("Period")){
                this.savedPeriod = period
            }
            const genre = this.deweyInfo.genre
            const country = this.deweyInfo.country
            let result = onPeriodClicked(idx+1, this.savedPeriod, genre, country) //periodNumber, sDewey$, sGenre$, sCountry$
            console.info("result: ", result)

            this.deweyInfo.dewey = result
        }
    },

    created: function () {},
    before: function () {},
    mounted: function(){},


    updated: function() {
        //update local value from prop
        this.lcCallLocal = this.lcCall
    }
  };

  </script>