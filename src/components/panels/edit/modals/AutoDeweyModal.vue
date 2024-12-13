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
                    <div class="dewey-menu-buttons">
                        <button @click="closeModal()">Close</button>
                    </div>
                </div>
                <div ref="autoDeweyModalContainer" class="auto-dewey-modal-container">
                    <h1 style="margin-left: 5px">AutoDewey 🤖</h1>
                    <div class="auto-dewey-container">
                        <div class="input-panel">
                            <label for="LcCall">LC Call Number: </label>
                            <input class="lcCallInput" name="LcCall" v-model="lcCallLocal" ref="inputLookup" type="text" />

                            <div class="dewey-toggle-btn-grp cssonly">
                                <div v-for="opt in autoDeweyGenres">
                                    <input type="radio" :id="opt" :value="opt" class="genre-type-radio" v-model="autoDeweyGenre" name="genre-selection" />
                                    <label onclick="" :for="opt" class="dewey-toggle-btn">{{opt}}</label>
                                </div>
                            </div>

                            <button @click="dewIt()">Create DDC</button>
                        </div>

                        <div class="auto-dewey-results" v-if="deweyInfo">
                            <h2>Results</h2>
                            <dl>
                                <dt>DDC</dt>
                                <dd>{{ deweyInfo.DDC }}</dd>

                                <dt>DDC Caption</dt>
                                <dd>{{ deweyInfo['DDC Caption'] }}</dd>

                                <dt>LCC Caption</dt>
                                <dd>{{ deweyInfo['LCC Caption'] }}</dd>
                            </dl>
                            <button @click="add()">Add</button>
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
    }
    .dewey-toggle-btn-grp.cssonly{
        width: 110px;
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
    import LcCallToDewey from '@/lib/auto_dewey'

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
            deweyInfo: null
        }
    },

    computed: {},
    methods: {
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