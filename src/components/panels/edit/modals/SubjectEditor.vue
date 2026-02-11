<template>


  <VueFinalModal :hide-overlay="false" :overlay-transition="'vfm-fade'" :content-transition="'vfm-fade'"
    :click-to-close="true" :esc-to-close="true" @closed="closeEditor()" :background="'non-interactive'"
    :lock-scroll="true" class="complex-lookup-modal" content-class="complex-lookup-modal-content">

    <div ref="complexLookupModalContainer" class="complex-lookup-modal-container">
      <div
        :style="`position: relative; ${this.preferenceStore.styleModalBackgroundColor()}; ${this.preferenceStore.styleModalTextColor()}`"
        class="subject-container-outer">
        <div style="position:absolute; right:2em; top:  0.25em; z-index: 100;">
          <div class="menu-buttons">
            <button @click="closeEditor()">Close</button>
          </div>
          <button v-if="subjectEditorMode=='link'"
            @click="editorModeSwitch('build')" data-tooltip="Build LCSH headings using a lookup list"
            class="subjectEditorModeButtons simptip-position-left"
            style="margin-right: 1em; background-color: black; height: 2em; display: inline-flex; display: none;">
            <svg fill="#F2F2F2" width="20px" height="20px" version="1.1" viewBox="0 0 100 100"
              xmlns="http://www.w3.org/2000/svg">
              <g>
                <path
                  d="m45.898 79.102h-38c-0.80078 0-1.5 0.69922-1.5 1.5v15.398c0 0.80078 0.69922 1.5 1.5 1.5h38c0.80078 0 1.5-0.69922 1.5-1.5v-15.398c-0.097657-0.80078-0.69922-1.5-1.5-1.5z" />
                <path
                  d="m92.199 79.102h-38c-0.80078 0-1.5 0.69922-1.5 1.5v15.398c0 0.80078 0.69922 1.5 1.5 1.5h38c0.80078 0 1.5-0.69922 1.5-1.5v-15.398c0-0.80078-0.69922-1.5-1.5-1.5z" />
                <path
                  d="m92.199 31.602h-38c-0.80078 0-1.5 0.69922-1.5 1.5v15.5c0 0.80078 0.69922 1.5 1.5 1.5h38c0.80078 0 1.5-0.69922 1.5-1.5v-15.5c0-0.90234-0.69922-1.5-1.5-1.5z" />
                <path
                  d="m7.8008 73.699h14.398c0.80078 0 1.5-0.69922 1.5-1.5v-15.398c0-0.80078-0.69922-1.5-1.5-1.5h-14.398c-0.80078 0-1.5 0.69922-1.5 1.5v15.5c0 0.80078 0.69922 1.3984 1.5 1.3984z" />
                <path
                  d="m30.5 73.699h39.102c0.80078 0 1.5-0.69922 1.5-1.5v-15.398c0-0.80078-0.69922-1.5-1.5-1.5h-39.102c-0.80078 0-1.5 0.69922-1.5 1.5v15.5c0 0.80078 0.69922 1.3984 1.5 1.3984z" />
                <path
                  d="m92.199 55.301h-14.398c-0.80078 0-1.5 0.69922-1.5 1.5v15.5c0 0.80078 0.69922 1.5 1.5 1.5h14.398c0.80078 0 1.5-0.69922 1.5-1.5v-15.5c0-0.80078-0.69922-1.5-1.5-1.5z" />
                <path
                  d="m24.199 26.199v15.199l-2.1016-2.1016c-0.80078-0.80078-2.1016-0.80078-3 0-0.80078 0.80078-0.80078 2.1016 0 3l5.6016 5.6016c0.39844 0.39844 0.89844 0.60156 1.5 0.60156 0.5 0 1.1016-0.19922 1.5-0.60156l5.6016-5.6016c0.80078-0.80078 0.80078-2.1016 0-3-0.80078-0.80078-2.1016-0.80078-3 0l-2.1016 2.1016v-15.199z" />
                <path
                  d="m7.8008 20.898h38c0.80078 0 1.5-0.69922 1.5-1.5v-15.398c0-0.80078-0.69922-1.5-1.5-1.5h-38c-0.80078 0-1.5 0.69922-1.5 1.5v15.5c0 0.69922 0.69922 1.3984 1.5 1.3984z" />
              </g>
            </svg>

            <span :class="[{ 'subjectEditorModeTextEnabled': (subjectEditorMode === 'build') }]">Build Mode</span>
          </button>
          <button v-if="subjectEditorMode=='build'"
            @click="editorModeSwitch('link')" data-tooltip="Build LCSH headings by entering a MARC encoded string"
            class="subjectEditorModeButtons simptip-position-left"
            style="background-color: black; height: 2em; display: inline-flex; display: none;">

            <svg fill="#F2F2F2" width="20px" height="20px" version="1.1" viewBox="0 0 100 100"
              xmlns="http://www.w3.org/2000/svg">
              <g fill-rule="evenodd">
                <path
                  d="m45.867 41.266-4.6016 4.6016c-4.6211-2.6719-10.633-2.0312-14.586 1.9219l-16.891 16.891c-4.7188 4.7188-4.7188 12.367 0 17.086l8.4453 8.4453c4.7188 4.7188 12.367 4.7188 17.086 0l16.891-16.891c3.9531-3.9531 4.5938-9.9648 1.9219-14.586l4.6016-4.6016c4.6211 2.6719 10.633 2.0312 14.586-1.9219l16.891-16.891c4.7188-4.7188 4.7188-12.367 0-17.086l-8.4453-8.4453c-4.7188-4.7188-12.367-4.7188-17.086 0l-16.891 16.891c-3.9531 3.9531-4.5938 9.9648-1.9219 14.586zm-6.6211 23.512-12.469 12.473-4.0273-4.0273 12.473-12.469zm6.7305-14.777 4.0234 4.0234 4.0234-4.0234-4.0234-4.0234zm31.273-23.223-12.473 12.469-4.0234-4.0234 12.469-12.473z" />
                <path
                  d="m23.484 27.902 4.418 4.418c1.2227 1.2227 3.1992 1.2227 4.4219 0 1.2188-1.2188 1.2188-3.1992 0-4.418l-4.4219-4.418c-1.2188-1.2227-3.1992-1.2227-4.418 0-1.2188 1.2188-1.2188 3.1992 0 4.418z" />
                <path
                  d="m76.516 72.098-4.418-4.418c-1.2188-1.2227-3.1992-1.2227-4.418 0-1.2227 1.2188-1.2227 3.1992 0 4.418l4.418 4.418c1.2188 1.2227 3.1992 1.2227 4.418 0 1.2227-1.2188 1.2227-3.1992 0-4.418z" />
                <path
                  d="m38.086 17.605 1.6172 6.0352c0.44531 1.668 2.1602 2.6562 3.8281 2.2109 1.6641-0.44531 2.6562-2.1602 2.207-3.8281l-1.6172-6.0352c-0.44531-1.668-2.1602-2.6562-3.8281-2.2109-1.6641 0.44531-2.6562 2.1602-2.207 3.8281z" />
                <path
                  d="m61.914 82.395-1.6172-6.0352c-0.44531-1.668-2.1602-2.6562-3.8281-2.2109-1.6641 0.44531-2.6562 2.1602-2.207 3.8281l1.6172 6.0352c0.44531 1.668 2.1602 2.6562 3.8242 2.2109 1.668-0.44531 2.6562-2.1602 2.2109-3.8281z" />
                <path
                  d="m15.988 44.121 6.0352 1.6172c1.668 0.44531 3.3828-0.54297 3.8281-2.2109 0.44531-1.6641-0.54297-3.3789-2.2109-3.8242l-6.0352-1.6172c-1.668-0.44922-3.3828 0.54297-3.8281 2.207-0.44531 1.668 0.54297 3.3828 2.2109 3.8281z" />
                <path
                  d="m84.012 55.879-6.0352-1.6172c-1.668-0.44531-3.3828 0.54297-3.8281 2.2109-0.44922 1.6641 0.54297 3.3789 2.207 3.8242l6.0391 1.6172c1.6641 0.44922 3.3789-0.54297 3.8281-2.207 0.44531-1.668-0.54297-3.3828-2.2109-3.8281z" />
              </g>
            </svg>

            <span :class="[{ 'subjectEditorModeTextEnabled': (subjectEditorMode === 'link') }]">Link Mode</span>

          </button>
        </div>


        <template v-if="subjectEditorMode == 'build'">


          <div :class="['subject-editor-container', { 'subject-editor-container-lowres': lowResMode }]"
            :style="`${this.preferenceStore.styleModalBackgroundColor()}`">


            <div :style="`${this.preferenceStore.styleModalBackgroundColor()};`"
              :class="['subject-editor-container-left', { 'subject-editor-container-left-lowres': lowResMode }]">

              <div id="search-in-holder" style="position: absolute; top:0">
                <span>Search In:</span>


                <button @click="searchModeSwitch('LCSHNAF')" :data-tooltip="'Shortcut: CTRL+ALT+1'"
                  :class="['simptip-position-bottom', { 'active': (searchMode === 'LCSHNAF') }]">LCSH/NAF</button>
                <button @click="searchModeSwitch('CHILD')" :data-tooltip="'Shortcut: CTRL+ALT+2'"
                  :class="['simptip-position-bottom', { 'active': (searchMode === 'CHILD') }]">Children's
                  Subjects</button>
                <button @click="searchModeSwitch('GEO')" :data-tooltip="'Shortcut: CTRL+ALT+3'"
                  :class="['simptip-position-bottom', { 'active': (searchMode === 'GEO') }]">Indirect Geo</button>
                <!-- <button @click="searchModeSwitch('WORKS')" :data-tooltip="'Shortcut: CTRL+ALT+4'" :class="['simptip-position-bottom',{'active':(searchMode==='WORKS')}]">Works</button> -->
                <button @click="searchModeSwitch('HUBS')" :data-tooltip="'Shortcut: CTRL+ALT+4'"
                  :class="['simptip-position-bottom', { 'active': (searchMode === 'HUBS') }]">Hubs</button>
                <button @click="searchModeSwitch('ENTITIES')" :data-tooltip="'Shortcut: CTRL+ALT+5'"
                  :class="['simptip-position-bottom', { 'active': (searchMode === 'ENTITIES') }]" v-if="configStore.returnUrls.env == 'staging'">Entities</button>
              </div>


              <div
                :style="`flex:1; align-self: flex-end; height: 95%; ${this.preferenceStore.styleModalBackgroundColor()}`"
                :class="{ 'scroll-all': preferenceStore.returnValue('--b-edit-complex-scroll-all') && !preferenceStore.returnValue('--b-edit-complex-scroll-independently') }">
                <div v-if="activeSearch !== false">{{ activeSearch }}</div>
                <div v-if="searchResults !== null" style="height: 100%">
                  <ComplexSearchResultsDisplay :searchResults="searchResults" :pickLookup="pickLookup"
                    :searchMode="searchMode" @loadContext="loadContext" @selectContext="selectContext" />

                </div>
              </div>

              <!-- Results Panel -->
              <DetailsPanel :contextData="contextData" :contextRequestInProgress="contextRequestInProgress"
                @addClassNumber="addClassNumber" @newSearch="newSearch" />




            </div>

            <div class="">



              <div class="component-container-fake-input">
                <div style="display: flex;">
                  <div style="flex:1; position: relative;">
                    <form autocomplete="off" style="height: 3em;">
                      <input v-on:keydown.enter.prevent="navInput" placeholder="Enter Subject Headings Here"
                        ref="subjectInput" autocomplete="off" type="text" v-model="subjectString"
                        @input="subjectStringChanged" @keydown="navInput" @keyup="navString" @click="navStringClick"
                        class="input-single-subject subject-input" id="subject-input">
                    </form>
                    <div v-for="(c, idx) in components" :ref="'cBackground' + idx"
                      :class="['color-holder', { 'color-holder-okay': (c.uri !== null) }, {'color-holder-literal': c.literal}, { 'color-holder-type-okay': (c.type !== null) }]"
                      v-bind:key="idx">
                      {{ c.label }}
                    </div>
                  </div>
                </div>
              </div>

              <div ref="toolbar" style="display: flex;">
                <div v-if="displayProvisonalNAR()">
                  <button @click="loadNacoStubModal" style="float: right;">Create NAR</button>
                </div>
                <div style="flex:2">
                  <ol v-if="showTypes" :class="['type-list-ol', { 'type-list-ol-lowres': lowResMode }]">
                    <li :class="['type-item', { 'type-item-selected': (type.selected) }]" v-for="type in activeTypes"
                      :key="type.value" @click="setTypeClick($event, type.value)"
                      :style="`${this.preferenceStore.styleModalTextColor()}`">
                      {{ type.label }}</li>
                  </ol>
                </div>
                <div style="flex:1">

                  <button v-if="lowResMode" @click="closeEditor"
                    style="float: right;margin: 0.6em; background-color: white; border: solid 1px rgb(42,42,42); color: rgb(42,42,42);"
                    :class="[{ 'add-button-lowres': lowResMode }]">Close</button>
                  <button v-if="okayToAdd == true" style="float: right;margin: 0.6em; z-index: 100" @click="add"
                    :class="[{ 'add-button-lowres': lowResMode }]">Add [SHIFT+Enter]</button>
                  <button v-else-if="okayToAdd == false && subjectString.length == 0" disabled
                    style="float: right;margin: 0.6em; display: none;"
                    :class="[{ 'add-button-lowres': lowResMode }]">Can't
                    Add</button>
                  <button v-else-if="okayToAdd == false" disabled style="float: right;margin: 0.6em;"
                    :class="[{ 'add-button-lowres': lowResMode }]">Can't Add</button>

                  <div v-if="this.pickCurrent != null">
                    <div class="clear-selected">
                      <button class="clear-selected-button" @click="clearSelected()"
                        title="Clear selection & re-enable update on hover">Remove selected</button>
                    </div>
                  </div>

                </div>
              </div>




            </div>



          </div>
        </template>
        <template v-else>

          <div style="padding: 5px;">



            <div class="component-container-fake-input" style="margin-top:2em">
              <div style="display: flex;">
                <div style="flex:1; position: relative;">
                  <form autocomplete="off" style="height: 3em;">
                    <input v-on:keydown.enter.prevent="linkModeTextChange" placeholder="Enter MARC encoded LCSH value"
                      autocomplete="off" type="text" v-model="linkModeString" ref="subjectInput"
                      class="input-single-subject subject-input">
                  </form>
                </div>
              </div>
            </div>

            <ul v-if="!linkModeSearching">
              <li v-if="linkModeResults === false">Enter MARC subject string above (with $ signs for subdivdion
                seperation) and press enter key</li>
            </ul>



            <ol v-if="!linkModeSearching">
              <template v-if="linkModeResults !== false">

                <template v-if="linkModeResults.resultType && linkModeResults.resultType == 'COMPLEX'">

                  <li>

                    <span
                      :class="{ 'link-mode-good-heading': (linkModeResults.hit.uri), 'link-mode-bad-heading': (!linkModeResults.hit.uri) }">
                      {{ linkModeResults.hit.label }}
                    </span>
                    <span v-if="linkModeResults.hit.heading && linkModeResults.hit.heading.subdivision"
                      class="link-mode-subdivision">(subdivision)</span>
                    <a class="link-mode-good-heading-alink" target="_blank" v-if="linkModeResults.hit.uri"
                      :href="linkModeResults.hit.uri">{{
                        linkModeResults.hit.uri.split('/')[linkModeResults.hit.uri.split('/').length - 1] }}</a>


                  </li>

                </template>

                <template v-else>

                  <li v-for="(hit, idx) in linkModeResults.hit" v-bind:key="idx">
                    <span :class="{ 'link-mode-good-heading': (hit.uri), 'link-mode-bad-heading': (!hit.uri) }">
                      {{ hit.label }}
                    </span>
                    <span v-if="hit.heading && hit.heading.subdivision"
                      class="link-mode-subdivision">(subdivision)</span>
                    <a class="link-mode-good-heading-alink" target="_blank" v-if="hit.uri" :href="hit.uri">{{
                      hit.uri.split('/')[hit.uri.split('/').length - 1] }}</a>
                  </li>
                </template>

              </template>
            </ol>

            <span style="color:darkred;"
              v-if="linkModeResults && linkModeResults.resultType && linkModeResults.resultType == 'ERROR'">{{
                linkModeResults.msg
              }}</span>

            <div style="display: flex;">
              <div style="flex:2">

                <h1 v-if="linkModeSearching"> <span id="loading-icon">⟳</span> Working...</h1>

                <button v-if="linkModeSearching === false" style="margin-right: 1em; margin-left: 2em"
                  @click="linkModeTextChange({ key: 'Enter', shiftKey: false })">Link Components [Enter]</button>
                <button v-if="linkModeResults !== false" style="" @click="addLinkMode">Add Heading
                  [SHIFT+Enter]</button>



              </div>
              <div style="flex:1">
                <button style="float:right; margin-right:1em" @click="closeEditor">Close</button>

              </div>
            </div>

          </div>

        </template>

      </div>


    </div>



  </VueFinalModal>













</template>


<style type="text/css" scoped>
.subject-lookup-modal-container {
  margin-left: auto;
  margin-right: auto;
  background-color: white;
  width: 95vw;
  height: 95vh;
}


body #app {
  background-color: white !important;
}

.subject-editor-container {
  width: 99%;
  margin-left: auto;
  margin-right: auto;
  /* height: 470px; */
  height: 90%;
}

.subject-editor-container-lowres {
  height: 350px;
  max-height: 350px;
}

.add-button-lowres {
  margin-top: 0 !important;
}

.subject-editor-container-left {
  display: flex;
  height: 95%;
  position: relative;
  overflow-y: hidden;
}

.subject-editor-container-left-lowres {
  font-size: 0.75em !important;
  height: 352px;
  max-height: 352px;

}

.subject-editor-container-right {
  flex: 1;
  align-self: flex-start;
  padding: 2em;
  /* height: 503px; */
  height: 100%;
  overflow-y: scroll;
  background: whitesmoke;

  padding-top: 5px;
}

/* .subject-editor-container-right-lowres {
      height: 304px;
      max-height: 304px;
    } */


.type-list-ol {
  padding-left: 0
}

.type-list-ol-lowres {
  margin: 0;
}


.color-holder {
  font-size: 1.5em;
  position: absolute;
  padding-top: 0.3em;

  pointer-events: none;
  border-style: solid;
  border-width: 3px;
  border-color: rgb(255 132 132 / 52%);
  border-radius: 0.25em;
  color: transparent;

  background-color: rgb(255 132 132 / 25%);
  /*letter-spacing: -0.04em;*/

  height: 1.5em;
  font-family: sans-serif;

  left: 0;
  top: 0;



}

.subject-input {
  font-family: sans-serif;
}

.input-single {
  width: 95%;
  border: none;
  height: 100%;
  font-size: 1.5em;


  background: none;
  transition-property: color;
  transition-duration: 500ms;
}

.input-single:focus {
  outline: none !important
}

.fake-option {
  font-size: 1em;
  cursor: pointer;
  text-indent: 2em hanging;
}

.fake-option:hover {
  background-color: whitesmoke;
}

.literal-option {
  font-style: italic;
}

.unselected::before {
  content: "• ";
  color: #999999;
}

/* .selected {
  background-color: whitesmoke;
} */

.selected::before {
  content: "> ";
  color: #999999;
}

.picked {
  font-weight: bold;
}

.picked::before {
  content: "✓ " !important;
  transition-property: all;
  transition-duration: 500ms;
  font-weight: bold;
  color: green;
  font-size: larger;
}

.modal-context-data-title {
  font-size: 1em;
  font-weight: bold;
}

.modal-context ul {
  margin-top: 0;
  margin-bottom: 0;
}

.modal-context-data-li {
  font-size: 0.85em;
}

.modal-context h3 {
  margin: 0;
  padding: 0;
}

.modal-context-icon {
  font-family: "fontello", Avenir, Helvetica, Arial, sans-serif;
  font-size: 1.25em;
  padding-right: 0.25em;

}

.color-holder-literal {
  background-color: #ffd90047;;
}
.color-holder-okay {
  background-color: #0080001f;
}

.color-holder-type-okay {
  border-color: #00800047;
}

.type-item {
  display: inline-block;
  border: solid 1px #9aa4a4;
  border-radius: 0.5em;
  padding: 0.1em;
  margin-left: 1em;
  cursor: pointer;
  background-color: transparent;
}

.type-item::before {
  content: " ";
}

.type-item-selected {
  background-color: #0080001f;
  border: solid 3px;
}

.input-single-subject {
  width: 99%;
  border: none;
  font-size: 1.5em;
  min-height: 1.5em;
  max-height: 1.5em;
  background: none;

  background-color: #fff;
  border: 1px solid #9aa4a4;
  border-top-right-radius: 0.5em;
  border-bottom-right-radius: 0.5em;



}

.input-single-subject:focus {
  outline: 0;
}

#search-in-holder button {
  font-size: 0.85em;
  background-color: white;
  color: black;
  border: solid 1px #c1c1c1;
}

#search-in-holder .active {
  background-color: whitesmoke;
  -webkit-box-shadow: inset 0px 0px 5px #c1c1c1;
  -moz-box-shadow: inset 0px 0px 5px #c1c1c1;
  box-shadow: inset 0px 0px 5px #c1c1c1;
}

.subjectEditorModeButtons {
  display: inline-flex;
  font-size: 0.9em;
  color: white;
  font-size: 1.1em;
  line-height: 1.5em;
}

.subjectEditorModeTextEnabled {
  text-decoration: underline;

}

.link-mode-good-heading,
.link-mode-bad-heading {
  font-size: 1.15em;
  font-weight: bold;
}

.link-mode-good-heading-alink {
  color: inherit;
}

.link-mode-subdivision {
  padding-left: 0.25em;
  padding-right: 0.25em;
}

.link-mode-good-heading::before {
  content: "✓ " !important;
  transition-property: all;
  transition-duration: 500ms;
  font-weight: bold;
  color: green;
  font-size: larger;
}

.link-mode-bad-heading::before {
  content: "x " !important;
  transition-property: all;
  transition-duration: 500ms;
  font-weight: bold;
  color: darkred;
  font-size: x-large;
}

.clear-selected-button {
  margin-top: 10px;
}

.menu-buttons {
  margin-right: 5px;
  padding-top: 5px;
  padding-left: 15px;
  float: right;
}

.subject-section {
  border-top: solid black;
  border-bottom: solid-black;
}

.scrollable-subjects {
  overflow-y: scroll;
}

.small-container {
  height: 33%;
}

.medium-container {
  height: 50%;
}

.large-container {
  height: 90%;
}

/* document.documentElement.clientHeight */
.scroll-all {
  overflow-y: scroll;
}

.subject-container-outer {
  /* height: v-bind('returnBrowserHeight()'); */
  height: 100%;
}

.subject-variant {
  color: #ffc107;
  font-weight: bold;
}

/*
    .left-menu-list-item-has-data::before {
      content: "✓ " !important;
      color: #999999;
    }

    li::before {
      content: "• ";
      color: #999999;
    }*/


.from-rda,
.from-auth {
  font-weight: bold;
}

.unusable {
  color: red;
}

.details-list {
  columns: 3;
  break-inside: avoid;
  padding-left: 20px;
}

.details-list:has(.details-details) {
  margin-top: 10px;
  padding-left: 0px;
  columns: 2;
  break-inside: avoid;
}

.details-details {
  list-style: none;
  break-inside: avoid;
}

.details-list>li {
  break-inside: avoid;
}

.see-search {
  width: 20px;
  height: 20px;
  font-size: x-small;
  border-radius: 50%;
  border: none;
  cursor: pointer;
}

ul:has(.modal-context-data-li) {
  padding-left: 20px;
}

.see-also {
  font-size: 12px;
  margin-right: 10px;
}

.expandable-class-label {
  cursor: help;
}

.expand {
  font-size: 14px;
}

.simptip-position-bottom::before,
.simptip-position-bottom::after {
  left: -30% !important;
}
</style>

<style>
div.may-sub-container span span.material-icons-outlined {
  font-size: .8em;
  position: relative;
  top: -3px;
}
</style>

<script>

import { usePreferenceStore } from '@/stores/preference'
import { useProfileStore } from '@/stores/profile'
import { useConfigStore } from '@/stores/config'
import { mapStores, mapState, mapWritableState } from 'pinia'
import { VueFinalModal } from 'vue-final-modal'
import short from 'short-uuid'

import AuthTypeIcon from "@/components/panels/edit/fields/helpers/AuthTypeIcon.vue";

import utilsNetwork from '@/lib/utils_network';

import { AccordionList, AccordionItem } from "vue3-rich-accordion";
import DetailsPanel from './helpers/DetailsPanel.vue'
import ComplexSearchResultsDisplay from './helpers/ComplexSearchResultsDisplay.vue'

const debounce = (callback, wait) => {
  let timeoutId = null;
  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      callback.apply(null, args);
    }, wait);
  };
}

export default {
  name: "SubjectEditor",
  components: {
    VueFinalModal,
    AuthTypeIcon,
    AccordionList,
    AccordionItem,
    DetailsPanel,
    ComplexSearchResultsDisplay
  },
  props: {
    structure: Object,
    searchValue: String,
    authorityLookup: String,
    isLiteral: Boolean,
    profileData: Object,
    searchType: String,
    fromPaste: Boolean,
    guid: String,
  },

  watch: {
    // // watch when the undoindex changes, means they are undoing redoing, so refresh the
    // // value in the acutal input box
    searchValue: function () {
      this.subjectString = this.searchValue
      this.linkModeString = this.searchValue
    },

    watchSort: function () { },

  },

  data: function () {
    return {
      searching: false,

      // subjectEditorMode: 'subjectEditorMode',
      subjectEditorMode: 'build',

      contextData: { nodeMap: {} },
      authorityLookupLocal: null,

      subjectString: '',
      components: [],
      lookup: {},
      searchResults: null,
      activeSearch: false,

      pickPostion: 0,
      pickLookup: {},
      pickCurrent: null,
      activeComponent: null,
      oldActiveComponent: null,
      activeComponentIndex: 0,
      oldActiveComponentIndex: 99,
      contextRequestInProgress: false,
      componetLookup: {},
      localContextCache: {},
      nextInputIsTypeSelection: false,
      okayToAdd: false,
      lowResMode: false,
      searchStringPos: 0,

      searchMode: "LCSHNAF",

      linkModeString: "",
      linkModeResults: false,
      linkModeSearching: false,

      showTypes: false,

      initialLoad: true, // when this load the first time

      nextInputIsVoyagerModeDiacritics: false,

      activeTypes: {
        'madsrdf:Topic': { label: 'Topic / Heading ($a $x)', value: 'madsrdf:Topic', selected: false },
        // 'madsrdf:GenreForm': { label: 'Genre ($v)', value: 'madsrdf:GenreForm', selected: false },
        'madsrdf:Geographic': { label: 'Geographic ($z)', value: 'madsrdf:Geographic', selected: false },
        'madsrdf:Temporal': { label: 'Chronological ($y)', value: 'madsrdf:Temporal', selected: false },
      },

      labelMap: {
        "notes": "Notes",
        "nonlatinLabels": "Non-Latin Authoritative Labels",
        "variantLabels": "Variants",
        "varianttitles": "Varants Titles",
        "birthdates": "Date of Birth",
        "deathdates": "Date of Death",
        "birthplaces": "Place of Birth",
        "locales": "Associated Locales",
        "activityfields": "Fields of Activity",
        "occupations": "Occupations",
        "languages": "Associated Languages",
        "lcclasss": "LC Classification",
        "lcclasses": "LC Classification",
        "broaders": "Has Broader Authority",
        "gacs": "GAC(s)",
        "collections": "MADS Collections",
        "sources": "Sources",
        "subjects": "Subjects",
        "marcKeys": "MARC Key",
        "relateds": "Related",
        "contributors": "Contributors",
        "identifiers": "Identifiers",
        "sees": "See Also",
        "countSubj": "Subject ff",
        "countName": "Contributor to",
      },

      panelDetailOrder: [
        "notes", "gacs", "nonlatinLabels", "variantLabels", "varianttitles", "contributors", "relateds", "birthdates", "deathdates", "birthplaces",
        "locales", "activityfields", "occupations", "languages",
        "sources", "sees", "lcclasses", "lcclasss", "identifiers", "broaders",
        "collections", "subjects", "marcKeys"
      ],
      selectedSortOrder: ""

    }
  },

  computed: {
    ...mapStores(usePreferenceStore),
    ...mapStores(useConfigStore),
    ...mapState(usePreferenceStore, ['diacriticUseValues', 'diacriticUse', 'diacriticPacks']),
    ...mapState(useProfileStore, ['returnComponentByPropertyLabel', 'duplicateComponentGetId', 'isEmptyComponent']),

    ...mapWritableState(useProfileStore, ['activeProfile', 'setValueLiteral', 'activeNARStubComponent', 'lastComplexLookupString', 'searchValueLocal', 'showNacoStubCreateModal', 'returnStructureByComponentGuid']),
  },
  methods: {

    // Emitted from DetailsPanel
    // Conduct a new search on "related" term
    newSearch: function (v) {
      this.subjectString = v
      this.subjectStringChanged()
      this.searchApis(v, v, this)
    },

    // Emitted from DetailsPanel
    // Add class number from details to Marva
    addClassNumber: async function (classNum) {
      // 2025454279
      let profile = this.activeProfile

      let label = "Classification numbers"
      let targetComponent = null //this.returnComponentByPropertyLabel('Classification numbers')
      let lastClassifiction

      for (let rt in profile.rt){
        for (let pt in profile.rt[rt].pt){
          if (profile.rt[rt].pt[pt]['propertyLabel'].toLowerCase() == label.toLowerCase()){
            if (rt.includes("lc:RT:bf2:Monograph:Work")){
              let temp = profile.rt[rt].pt[pt]
              let userValue = temp.userValue
              let type = false
                try {
                  type = userValue["http://id.loc.gov/ontologies/bibframe/classification"][0]["@type"]
                } catch{
                  // empty component
                }
                lastClassifiction = pt
                if (type == "http://id.loc.gov/ontologies/bibframe/ClassificationLcc" && !temp.deleted){
                  targetComponent = temp
                  break
                } else if (!type){
                  targetComponent = temp
                  break
                }
            }
          }
        }
      }

      let newClass
      // If no match, need to add component
      if (!targetComponent || !this.isEmptyComponent(targetComponent)){
        let structure = this.returnComponentByPropertyLabel('Classification numbers')
        newClass = await this.duplicateComponentGetId(structure['@guid'], structure, "lc:RT:bf2:Monograph:Work", lastClassifiction)
        targetComponent = profile.rt["lc:RT:bf2:Monograph:Work"].pt[newClass[0]]
      }

      let propertyPath = [
        { level: 0, propertyURI: "http://id.loc.gov/ontologies/bibframe/classification" },
        { level: 1, propertyURI: "http://id.loc.gov/ontologies/bibframe/classificationPortion" }
      ]

      let fieldGuid = null
      try {
        fieldGuid = targetComponent.userValue["http://id.loc.gov/ontologies/bibframe/classification"][0]["http://id.loc.gov/ontologies/bibframe/classificationPortion"][0]["@guid"]
      } catch (err) {
        fieldGuid = short.generate()
      }

      this.setValueLiteral(targetComponent['@guid'], fieldGuid, propertyPath, classNum, null, null)



    },

    //parse complex headings so we can have complete and broken up headings
    parseComplexSubject: async function (uri) {
      let returnUrls = useConfigStore().returnUrls
      let url = uri
      if (returnUrls.env == 'production') {
        url = url.replace('http://id.', 'https://preprod-8080.id.')
        url = url.replace('https://id.', 'https://preprod-8080.id.')
      }
      let data = await utilsNetwork.fetchSimpleLookup(url + ".json", true)
      let components = false
      let subfields = false
      let marcKey = false
      for (let el of data) {
        if (el["@id"] == uri) {
          marcKey = el["http://id.loc.gov/ontologies/bflc/marcKey"][0]["@value"]
          // we're not looking at a GEO heading, so the components will be URIs
          // GEO won't have URIs, so they can be ignored
          if (!el["@type"].includes("http://www.loc.gov/mads/rdf/v1#HierarchicalGeographic")) {
            components = el["http://www.loc.gov/mads/rdf/v1#componentList"]
            break
          }
        }
      }

      //get the subfields from the marcKey
      if (marcKey) {
        subfields = marcKey.slice(5)
        // subfields = subfields.match(/\$./g)
        subfields = subfields.match(/\$[axyzv]{1}/g)
      }

      return { "components": components, "subfields": subfields, "marcKey": marcKey }
    },

    /**
     * When loading from an existing subject, the component lookup
     * needs to be build, so the components will have URIs, types,
     * and be flaged as literals or not
     *
     * @param {obj} incomingSubjects - the existing subject data
     */
    buildLookupComponents: function (incomingSubjects) {
      if (!incomingSubjects || typeof incomingSubjects == "undefined") {
        return
      }

      let lookUp

      // The subject is made of multiple parts
      if (Array.isArray(incomingSubjects)) {
        for (let subjIdx in incomingSubjects) {
          this.componetLookup[subjIdx] = {}
          let type = incomingSubjects[subjIdx]["@type"]
          if (Object.keys(incomingSubjects[subjIdx]).includes("http://www.loc.gov/mads/rdf/v1#authoritativeLabel")) {
            lookUp = "http://www.loc.gov/mads/rdf/v1#authoritativeLabel"
          } else {
            lookUp = "http://www.w3.org/2000/01/rdf-schema#label"
          }
          try {
            let label = incomingSubjects[subjIdx][lookUp][0][lookUp].replaceAll("--", "‑‑")

            //Set up componentLookup, so the component builder can give them URIs
            this.componetLookup[subjIdx][label] = {
              label: incomingSubjects[subjIdx][lookUp][0][lookUp],
              literal: incomingSubjects[subjIdx]["@id"] ? false : true,
              uri: incomingSubjects[subjIdx]["@id"] ? incomingSubjects[subjIdx]["@id"] : null,
              type: type,
              marcKey: incomingSubjects[subjIdx]["http://id.loc.gov/ontologies/bflc/marcKey"] ? incomingSubjects[subjIdx]["http://id.loc.gov/ontologies/bflc/marcKey"][0]["http://id.loc.gov/ontologies/bflc/marcKey"] : ""
            }

          } catch (err) {
            console.error(err)
          }
        }
      } else {
        // dealing with a complex subject
        this.componetLookup[0] = {}
        let type = incomingSubjects["@type"] ? incomingSubjects["@type"] : ""

        if (Object.keys(incomingSubjects).includes("http://www.loc.gov/mads/rdf/v1#authoritativeLabel")) {
          lookUp = "http://www.loc.gov/mads/rdf/v1#authoritativeLabel"
        } else {
          lookUp = "http://www.w3.org/2000/01/rdf-schema#label"
        }
        try {
          let label = incomingSubjects[lookUp][0][lookUp].replaceAll("--", "‑‑")
          //Set up componentLookup, so the component builder can give them URIs
          this.componetLookup[0][label] = {
            label: incomingSubjects[lookUp][0][lookUp],
            literal: incomingSubjects["@id"] ? false : true,
            uri: incomingSubjects["@id"] ? incomingSubjects["@id"] : null,
            type: type,
            marcKey: incomingSubjects["http://id.loc.gov/ontologies/bflc/marcKey"] ? incomingSubjects["http://id.loc.gov/ontologies/bflc/marcKey"][0]["http://id.loc.gov/ontologies/bflc/marcKey"] : ""
          }
        } catch (err) {
          console.error(err)
        }
      }
    },

    /**
     * Creates components from the search string
     *
     * If the subject is loaded from an existing record, there will be a search string
     * but there won't be components.
     */
    buildComponents: function (searchString) {
      // searchString = searchString.replace("—", "--") // when copying a heading from class web

      let subjectStringSplit = searchString.split('--')

      let targetIndex = []
      let componentLookUpCount = Object.keys(this.componetLookup).length

      // opening an authority after it was created
      if (componentLookUpCount > 0) { //We might be dealing with something that needs to stitch some terms together
        if (componentLookUpCount < subjectStringSplit.length) {
          let target = false
          let targetType = null
          let splitTarget = false
          for (let i in this.componetLookup) {
            for (let j in this.componetLookup[i]) {
              targetType = this.componetLookup[i][j].type
              if (this.componetLookup[i][j].label.includes("--")) {
                target = this.componetLookup[i][j].label.replaceAll("--", "‑‑")
                targetIndex = i  // needs this to ensure the target will go into the search string in the right place
                splitTarget = target.split('‑‑')
              }

              let matchIndx = []
              if (target) {  // && targetType == 'madsrdf:Geographic'
                for (let i in subjectStringSplit) {
                  if (target == subjectStringSplit[i]) { matchIndx.push(i); break } // if there is an exact match, keep it and move on
                  if (target.includes(subjectStringSplit[i])) {  //&& subjectStringSplit[i].length > 3
                    matchIndx.push(i)
                  }
                }

                //remove them
                for (let i = matchIndx.length - 1; i >= 0; i--) {
                  subjectStringSplit.splice(matchIndx[i], 1)
                }
                // add the combined terms
                // subjectStringSplit.push(target)
                subjectStringSplit.splice(targetIndex, 0, target)
              }
            }
          }
        }
      }

      // clear the current
      this.components = []
      let id = 0

      let activePosStart = 0

      // if the componentlist is as long as the split string, but the indexes aren't continuous, adjust them
      let prev = 0
      if (subjectStringSplit.length == Object.keys(this.componetLookup).length) {
        for (let idx in this.componetLookup){
          if (idx != prev + 1 && idx != 0){
            this.componetLookup[Number(prev)+1] = this.componetLookup[idx]
            delete this.componetLookup[idx]
            idx = Number(prev) + 1
          }
          prev = Number(idx)
        }
      }

      /**
       * When a string in the middle of a heading changes
       * Need a way to track this.
       */
      let diff = []
      let offset = 0
      for (let ss of subjectStringSplit) {
        if (subjectStringSplit.length < Object.keys(this.componetLookup).length) {
          diff = Object.keys(this.componetLookup).filter(x => !subjectStringSplit.includes(Object.keys(this.componetLookup[x])[0]))
        }

        if (diff.length > 0) {
          if (diff.includes(id.toString()) && id.toString() == diff.at(-1)) {
            offset = Object.keys(this.componetLookup).length - subjectStringSplit.length
          }
        }

        // check the lookup to see if we have the data for this label
        let uri = null
        let type = null
        let literal = null
        let marcKey = null
        let nonLatinLabel = null
        let nonLatinMarcKey = null

        let tempSs = ss.replace("‑", "-")

        if (this.componetLookup[id + offset] && this.componetLookup[id + offset][ss]) {
          literal = this.componetLookup[id + offset][ss].literal
          uri = this.componetLookup[id + offset][ss].uri
          marcKey = this.componetLookup[id + offset][ss].marcKey
          nonLatinLabel = this.componetLookup[id + offset][ss].nonLatinTitle
          nonLatinMarcKey = this.componetLookup[id + offset][ss].nonLatinMarcKey
        } else if (this.componetLookup[id + offset] && this.componetLookup[id + offset][tempSs]) {
          literal = this.componetLookup[id + offset][tempSs].literal
          uri = this.componetLookup[id + offset][tempSs].uri
          marcKey = this.componetLookup[id + offset][tempSs].marcKey
          nonLatinLabel = this.componetLookup[id + offset][tempSs].nonLatinTitle
          nonLatinMarcKey = this.componetLookup[id + offset][tempSs].nonLatinMarcKey
        }

        if (uri && uri.includes("/hubs/")) {
          type = "bf:Hub"
        }
        // set the type
        try {
          type = this.componetLookup[id + offset][ss].type
        } catch(e){
          type = null
        }
        this.components.push({
          label: ss,
          uri: uri,
          id: id,
          type: type,
          complex: ss.includes('‑‑'),
          literal: literal,
          posStart: activePosStart,
          posEnd: activePosStart + ss.length,
          marcKey: marcKey,
          nonLatinLabel: nonLatinLabel,
          nonLatinMarcKey: nonLatinMarcKey,
        })

        // increase the start length by the length of the string and also add 2 for the "--"
        activePosStart = activePosStart + ss.length + 2

        id++
      }

      //make sure the searchString matches the components
      this.subjectString = this.components.map((component) => component.label).join("--")

    },

    /**
    * Kicks off search when the link mode string is changed
    * @return {void}
    */
    linkModeTextChange: async function (event) {

      try {
        this.$refs.subjectInput.focus()
      } catch (err) {
        console.log("Loading from existing data")
      }

      if (event.key === 'Enter' && event.shiftKey === false) {
        this.linkModeResults = false
        this.linkModeSearching = true
        if (this.linkModeString.length > 2){
          this.linkModeResults = await utilsNetwork.subjectLinkModeResolveLCSH(this.linkModeString)
        } else {
          return
        }
        this.linkModeSearching = false

      } else if (event.key === 'Enter' && event.shiftKey === true) {
        this.addLinkMode()
      }

      if (event.preventDefault) { event.preventDefault() }
      return false
    },

    focusInput: function () {
      this.$nextTick(() => {

        let timeoutFocus = window.setTimeout(() => {
          if (this.$refs.subjectInput) {
            this.$refs.subjectInput.focus()
            window.clearTimeout(timeoutFocus)
          }
        }, 10)
      })
    },

    /**
    * Change state to display different interface
    * @param {string} mode - which mode to use "build" "link"
    * @return {array} - An array of the pts, but only occuring once
    */
    editorModeSwitch: function (mode) {
      this.subjectEditorMode = mode
      // this.$store.dispatch("subjectEditorMode", { self: this, mode: mode})

      if (mode == 'build') {
        this.subjectString = this.linkModeString
        this.subjectStringChanged()
      } else {
        this.linkModeString = this.subjectString
      }

      this.$nextTick(() => {
        this.$refs.subjectInput.focus()
      })

    },

    adjustStartEndPos: function (obj) {
      //need to make sure postStart and posEnd are correct, and the id
      for (let x in obj) {
        let prev = null
        let current = obj[x]

        if (x > 0) {
          prev = obj[x-1]
        }

        if (x == 0) {
          current.posStart = 0
        } else {
          current.posStart = prev.posEnd + 2
        }
        current.posEnd = current.posStart + current.label.length

        current.id = x
      }

      return obj
    },

    searchModeSwitch: function (mode) {
      this.searchMode = mode

      /**
       * If it's in GEO mode look at all the components and build the
       * subject string based on the ones with out URIs.
       * How does this affect literals
       *
       * (c.uri !== null || c.literal)
       */

      if (mode == "GEO") {
        // if the User selected the first part of an indirect geo from the LCSH/LCNAF
        // search and then swaps to GEO to finish, replace the `--` between the two
        // to ease the process
        // if there is a component that is != literal and uri == null, get the index
        let potentialGeoIdx = this.components.findIndex((i) => (i.literal == null || i.literal == true) && i.uri == null)
        let prevComponent
        if (potentialGeoIdx > 1) {
          prevComponent = JSON.parse(JSON.stringify(this.components.at(potentialGeoIdx - 1)))
          // if the previous component is geographic, swap the -- for not `‑‑` between
          if (prevComponent.type == 'madsrdf:Geographic' || prevComponent.type == "http://www.loc.gov/mads/rdf/v1#Geographic") {
            let posEnd = this.subjectString.lastIndexOf(this.components[potentialGeoIdx].label)
            let posStart = posEnd - 2
            this.subjectString = this.subjectString.slice(0, posStart) + '‑‑' + this.subjectString.slice(posEnd)
            this.subjectStringChanged()

            let inputField = document.getElementById("subject-input")
            inputField.setSelectionRange(posStart, posStart)
            inputField.focus()

            this.navStringClick({})
          }
        }

        /**
         * When dealing with a switch to GEO, we need to combine the "loose" components
         * into 1 so the search will work.
         */
        //get the loose components
        let looseComponents = []
        let indx = []
        let componentMap = []
        for (let c in this.components) {
          if (this.components[c].uri == null && this.components[c].literal != true && !this.components[c].label.includes("‑‑")) {
            looseComponents.push(this.components[c])
            indx.push(c)
            componentMap.push("-")
          } else {
            componentMap.push(c)
          }
        }
        //only stitch the loose components togethere if there are 2 next to each other
        if (indx.length == 2 && indx[1] - 1 == indx[0]) {
          /** !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
           *  !! the `not` hyphens are very important !!
           *  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
           */
          // Update the id of the active component to indx[0] so we're working with the first component of the looseComponents
          this.activeComponentIndex = Number(indx[0])

          //this.activeComponent = looseComponents.map((comp) => {return comp.id == this.activeComponentIndex})
          this.activeComponent = looseComponents.filter((comp) => comp.id == this.activeComponentIndex)[0]
          //this.activeComponent = looseComponents[this.activeComponentIndex]

          this.activeComponent.id = this.activeComponentIndex
          //update the active component with the loose components
          for (let c in looseComponents) {
            if (c != 0) {
              let part1 = ""
              if (c == 1) {
                part1 = looseComponents[0].label
              } else {
                part1 = this.activeComponent.label
              }
              if (!part1.includes("‑‑")){
                const part2 = looseComponents[c].label
                this.activeComponent.label = part1 + "‑‑" + part2
                this.activeComponent.posEnd = looseComponents[c].posEnd
              }
            }
          }
          this.activeComponent.posStart = looseComponents[0].posStart

          // we need to make sure the order is maintained
          // use the component map to determine maintain order
          let final = []
          for (let el in componentMap) {
            let good = componentMap[el] != '-'
            if (good) {
              final.push(this.components[el].label)
            } else {
              final.push(this.activeComponent.label)
            }
          }

          final = new Set(final)
          final = Array.from(final)

          this.subjectString = final.join("--")

          //Splice the components from the first looseComponet to the end and add the new activeComponent to the end
          this.components.splice(indx[0], indx.length, this.activeComponent)

          // need to make sure postStart and posEnd are correct, and the id
          this.adjustStartEndPos(this.components)
          for (let x in this.components) {
            let prev = null
            let current = this.components[x]

            if (x > 0) {
              prev = this.components[x] - 1
            } else if (x == 0) {
              current.posStart = 0
            } else {
              current.posStart = prev.posEnd + 2
            }
            current.posEnd = current.posStart + current.label.length

            current.id = x
          }

          // get the boxes lined up correctly
          try {
            this.renderHintBoxes()
          } catch (err) { }

          // hacky, but without this `this.componentLooks` won't match in `subjectStringChanged`
          for (let i in this.components) {
            for (let j in this.componetLookup) {
              const key = Object.keys(this.componetLookup[j])[0]
              if (this.components[i].label == key) {
                this.componetLookup[i] = this.componetLookup[j]
              }
            }
          }
		} 
		console.info("Components: ", this.components)
	  } else if (mode == 'ENTITIES'){
		// change "--" to other "--"	this might be the one -> "‑‑"
		this.subjectString = this.subjectString.replace("--", "‑‑")
		//Need to update components too?
	    this.components[0].label = this.subjectString
		this.components[0].posEnd = this.subjectString.length
		this.components[0].literal = null
		this.components[0].uri = null
		this.components.splice(1)
		this.activeComponent = this.components[0]
		try {
			this.renderHintBoxes()
		} catch(err) { }
      } else {
        // Above we took loose components and combined them,
        // here we undo that incase someone made a mistake and the geo
        // term has a subject in it that needs to be split out.
        let unApproved = []
        let unApprovedIdx = []
        let approved = []
        for (let c in this.components) {
          if (this.components[c].uri == null && this.components[c].literal != true) {
            unApproved.push(this.components[c])
            unApprovedIdx.push(c)
          } else {
            approved.push(this.components[c])
          }
        }
        //remove the terms that have been exploded
        for (let i in unApprovedIdx) {
          if (this.components[unApprovedIdx[i]].label.includes("‑‑")) {
            this.components.splice(unApprovedIdx[i], 1)
          }
        }

        for (let c in unApproved) {
          let target = unApproved[c]
          let id = target.id

          if (target.label.includes("‑‑")) {
            let needComponents = target.label.split("‑‑")
            //build and add the exploded components
            for (let idx in needComponents) {
              let start = 0
              let end = 0

              let previous = null
              if (idx == 0) {
                start = 0
              } else {
                previous = this.components.at(-1)
                start = previous.posEnd + 2 //for the hyphens
              }
              end = start + needComponents[idx].length
              this.components.splice(id, 0, {
                label: needComponents[idx],
                uri: null,
                id: idx,
                type: mode == "GEO" ? 'madsrdf:Geographic' : 'madsrdf:Topic', // type should get updated when the selection is mad
                complex: false,
                literal: null,
                posStart: start,
                posEnd: end,
              })

              id++
            }


          }

          let final = this.components.map((component) => component.label)

          this.adjustStartEndPos(this.components)
          this.subjectString = final.join("--")
        }

        // get the boxes lined up correctly
        this.renderHintBoxes()
		this.subjectStringChanged()
      }

      if (this.activeComponent && this.activeComponent.label) {
        this.searchApis(this.activeComponent.label, this.subjectString, this)
      }

      try {
        this.$refs.subjectInput.focus()
      } catch(TypeError){
        console.error("Couldn't focus on input")
      }

    },

    /**
     * Build the pick lookup so we can adjust the sorting here.
     *
     * Without rebuilding the picklookup list, selectiong will be off.
     * We do it here so that we can adjust the current search results without
     * needing to do another search.
     *
     */
    buildPickLookup: function () {
      for (let x in this.searchResults.subjectsComplex) {
        this.pickLookup[x] = this.searchResults.subjectsComplex[x]
      }

      for (let x in this.searchResults.subjectsChildrenComplex) {
        this.pickLookup[x] = this.searchResults.subjectsChildrenComplex[x]
      }

      for (let x in this.searchResults.subjectsSimple) {
        this.pickLookup[parseInt(x) + parseInt(this.searchResults.subjectsComplex.length)] = this.searchResults.subjectsSimple[x]
      }

      for (let x in this.searchResults.subjectsChildren) {
        this.pickLookup[parseInt(x) + parseInt(this.searchResults.subjectsChildrenComplex.length)] = this.searchResults.subjectsChildren[x]
      }

      for (let x in this.searchResults.names) {
        this.pickLookup[(this.searchResults.names.length - x) * -1] = this.searchResults.names[x]
      }

      for (let x in this.searchResults.exact) {
        this.pickLookup[(this.searchResults.names.length - x) * -1 - 2] = this.searchResults.exact[x]
      }

      for (let x in this.searchResults.entities) {
        this.pickLookup[x] = this.searchResults.entities[x]

      }
    },

    // some context messing here, pass the debounce func a ref to the vue "this" as that to ref in the function callback
    searchApis: debounce(async (searchString, searchStringFull, that) => {
      that.pickCurrent = null //reset the current selection when the search changes

      that.searchResults = null
      that.x = 'Seaching...'
      that.pickPostion = 0

      searchString = searchString.trim().normalize()
      searchStringFull = searchStringFull.trim().normalize()

      // make the "searching..." text grow
      let ti = window.setInterval(() => { that.activeSearch = ((!that.activeSearch) ? '' : that.activeSearch) + '.' }, 100)

      // a backup here just in case the search times out or takes forever
      let tiBackup = window.setTimeout(() => {
        window.clearInterval(ti)
        that.activeSearch = false

      }, 10000)

      let searchStringFullPieces = searchStringFull.split('--')
      let currentPos = searchStringFullPieces.indexOf(searchString)

      searchString = searchString.replaceAll('‑', '-')
      searchStringFull = searchStringFull.replaceAll('‑', '-')

      that.searchStringPos = currentPos

      let complexSub = []

      // to search for complex subdivisions, we'll look that come after the first term

      if (currentPos > 1) {
        //this will search `s1--s2`
        let newTerm = searchStringFullPieces.slice(currentPos - 1, currentPos + 1).join("--")
        if (newTerm.includes("--")) {
          complexSub.push(newTerm)
        }
      }

      if (currentPos == 1) {
        //this will search `s1--s2`
        let newTerm = searchStringFullPieces[1]
        complexSub.push(newTerm)
      }

      if (searchStringFull.includes("---")) {
        searchStringFull = searchStringFull.replace("---", "‑--")
      }

      if (searchString.length > 2){
        that.searchResults = await utilsNetwork.subjectSearch(searchString, searchStringFull, complexSub, that.searchMode)
      } else {
        return
      }
      // that.searchResults = await utilsNetwork.subjectSearch(searchString, searchStringFull, that.searchMode)

      // if they clicked around while it was doing this lookup bail out
      // if (that.activeSearchInterrupted){



      //   window.clearInterval(ti)
      //   window.clearTimeout(tiBackup)
      //   that.activeSearch = false
      //   that.activeSearchInterrupted = false

      //   console.log("that.activeSearchInterrupted",that.activeSearchInterrupted)

      //   return false

      // }



      // replace the true keyboard hypen with the werid hypen to prevent spliting on open lifedates
      for (let s of that.searchResults.names) {
        s.labelOrginal = s.label
        s.label = s.label.replaceAll('-', '‑')
      }


      for (let s of that.searchResults.subjectsComplex) {
        s.labelOrginal = s.label
        s.complex = true
        s.label = s.label.replaceAll('-', '‑')
      }

	  for (let s of that.searchResults.entities){
		s.entity = true
	  }

      for (let s of that.searchResults.subjectsSimple) {
        if (s.suggestLabel && s.suggestLabel.includes('(DEPRECATED')) {
          s.suggestLabel = s.suggestLabel.split('(DEPRECATED')[0] + "(DEPRECATED)"
        }
      }

      for (let s of that.searchResults.hierarchicalGeographic) {
        if (s.suggestLabel && s.suggestLabel.includes(' (USE ')) {
          s.suggestLabel = s.label
        }
      }
      if (that.searchMode == 'WORKS' || that.searchMode == 'HUBS') {
        for (let s of that.searchResults.subjectsSimple) {
          if (s.suggestLabel && s.suggestLabel.includes(' (USE ')) {
            s.suggestLabel = s.label + " (USE FOR " + s.vlabel + ")"
          }
        }
        for (let s of that.searchResults.subjectsComplex) {
          if (s.suggestLabel && s.suggestLabel.includes(' (USE ')) {
            s.suggestLabel = s.label + " (USE FOR " + s.vlabel + ")"
          }
        }
      }

      for (let s of that.searchResults.hierarchicalGeographic) {
        s.labelOrginal = s.label
        s.hierarchicalGeographic = true
        s.label = s.label.replaceAll('-', '‑')
      }

      if (that.searchResults.hierarchicalGeographic.length > 0 && that.searchResults.subjectsComplex.length == 0) {
        that.searchResults.subjectsComplex = that.searchResults.hierarchicalGeographic
      }

      that.pickLookup = {}

      that.pickPostion = that.searchResults.subjectsSimple.length + that.searchResults.subjectsComplex.length - 1

      that.buildPickLookup()

      for (let k in that.pickLookup) {
        that.pickLookup[k].picked = false
        if (searchString.toLowerCase() == that.pickLookup[k].label.toLowerCase() && !that.pickLookup[k].literal) {
          // if the labels are the same for the current one selected don't overide it
          if (that.activeComponent && that.pickLookup[k].label.replaceAll('‑', '-') == that.activeComponent.label.replaceAll('‑', '-') && that.activeComponent.uri) {
            if (that.activeComponent.uri == that.pickLookup[k].uri) {
              that.pickPostion = k
              that.pickLookup[k].picked = true
              that.selectContext()
            }
          } else {
            // if they started typing the next word already then stop this
            if (that.subjectString.replaceAll('‑', '-') != searchStringFull.replaceAll('‑', '-')) {
              break
            }
            // do they even have the same label currently, they might be clicking around in the interface
            // so at this point with the async lookup this is not even the right componen
            if (that.pickLookup[k].label != that.activeComponent.label) {
              break
            }
          }
        }
      }

      // that.contextData.dispatch("clearContext", { self: that})
      if (that.pickLookup[that.pickPostion] && !that.pickLookup[that.pickPostion].literal) {
        that.contextRequestInProgress = true
        // that.contextData = await utilsNetwork.returnContext(that.pickLookup[that.pickPostion].uri)
        that.contextData = that.getContext()

        // keep a local copy of it for looking up subject type
        if (that.contextData) {
          that.localContextCache[that.contextData.uri] = JSON.parse(JSON.stringify(that.contextData))
        }
      }

      window.clearInterval(ti)
      window.clearTimeout(tiBackup)
      that.activeSearch = false

      that.$nextTick(() => {
        that.checkToolBarHeight()



        // window.setTimeout(()=> {

        // find out how small the smallest one is and then loop through and try to make all of them
        // that size so they fit on one line of the display
        let smallest_size = 1000;
        for (let el of document.getElementsByClassName("fake-option")) {

          if (el.offsetHeight < smallest_size && el.offsetHeight != 0) {
            smallest_size = el.offsetHeight
          }
        }
        // alert(smallest_size)
        // for (let el of document.getElementsByClassName("fake-option")){
        //   if (el.offsetHeight > smallest_size){
        //     let startFontSize = 1.25
        //     while (el.offsetHeight >smallest_size){
        //       startFontSize=startFontSize-0.01
        //       el.style.fontSize = startFontSize + 'em';
        //       if (startFontSize<=0.01){
        //         el.style.fontSize = "1.25em"
        //         break
        //       }
        //     }
        //   }
        // }
        // },100)
      })

    }, 500),

    navStringClick: function (event) {
      // when clicked send it over to the navString func with fake key property to trigger if statement
      event.key = 'ArrowLeft'
      this.navString(event)
    },

    navString: function (event) {
      if (event.key == 'ArrowLeft' || event.key == 'ArrowRight') {
        // don't let them leave a trailing -- when they are clicking around like wild
        // if (this.subjectString.endsWith('--')){
        //   this.subjectString = this.subjectString.slice(0,this.subjectString.length-2)
        // }
        if (!event.target) {
          event = { target: this.$refs.subjectInput }
        }

        for (let c of this.components) {
          if (event.target.selectionStart >= c.posStart && event.target.selectionStart <= c.posEnd + 1) {
            this.activeComponent = c
            this.activeComponentIndex = c.id
            break
          }
        }

        // keep track of where we were so that we don't do unessary refreshes
        if (this.oldActiveComponentIndex != this.activeComponentIndex) {
          this.updateAvctiveTypeSelected()
          this.subjectStringChanged(event)
          this.oldActiveComponentIndex = this.activeComponentIndex
        } else if (this.activeComponent.uri === null) {
          this.updateAvctiveTypeSelected()
          this.subjectStringChanged(event)
        }
      }

      // Literature, Modern--Translations into Albanian--History and criticism
      // text macros
      let useTextMacros = this.preferenceStore.returnValue('--o-diacritics-text-macros')
      if (useTextMacros && useTextMacros.length > 0) {
        for (let m of useTextMacros) {
          if (event.target.value.indexOf(m.lookFor) > -1) {
            event.target.value = event.target.value.replace(m.lookFor, m.replaceWith)
            // manually change the v-model var and force a update
            this.$nextTick(() => {
              this.subjectString = event.target.value
              this.subjectStringChanged()
              this.navString({ key: 'ArrowRight' })
            })
          }
        }
      }


    },

    getContext: async function () {
      if (this.pickLookup[this.pickPostion].literal) {
        this.contextData = this.pickLookup[this.pickPostion]
        return false
      }
      //let temp = await utilsNetwork.returnContext(this.pickLookup[this.pickPostion].uri)
      this.contextData = this.pickLookup[this.pickPostion].extra

      if (this.pickLookup[this.pickPostion].uri) {
        // Pull information into contextData from 1 level up
        this.contextData.literal = false
        this.contextData.title = this.pickLookup[this.pickPostion].label
        this.contextData.uri = this.pickLookup[this.pickPostion].uri
        if (Object.keys(this.contextData).includes("marcKeys")) {
          this.pickLookup[this.pickPostion].marcKey = this.contextData.marcKeys[0]
        } else if (Object.keys(this.contextData).includes("marcKey")) {
          this.pickLookup[this.pickPostion].marcKey = this.contextData.marcKey
        }
        let types = this.pickLookup[this.pickPostion].extra['rdftypes']

        // Setting the type in contextData
        this.contextData.type = types.includes("Hub") ? "bf:Hub" : types.includes("Work") ? "bf:Work" : "madsrdf:" + types[0]
        this.contextData.typeFull = this.contextData.type.replace('madsrdf:', 'http://www.loc.gov/mads/rdf/v1#')

        //Check if it's a Jurisdiction, and overwrite
        if (this.pickLookup[this.pickPostion].extra['collections'].includes("http://id.loc.gov/authorities/names/collection_Jurisdictions")) {
          this.contextData.type = "bf:Jursidiction"
          this.contextData.typeFull = "http://id.loc.gov/ontologies/bibframe/Jurisdiction"
        }

        this.contextData.gacs = this.pickLookup[this.pickPostion].extra.gacs

      } else {
        this.contextData.literal = true
      }

      this.contextRequestInProgress = false
    },

    /** Clear the current selection so that hovering will update the preview again */
    clearSelected: function () {
      this.pickLookup[this.pickCurrent].picked = false
      this.pickCurrent = null
    },

    runMacroExpressMacro(event) {
      for (let macro of this.diacriticUseValues) {
        if (event.code == macro.code && event.ctrlKey == macro.ctrlKey && event.altKey == macro.altKey && event.shiftKey == macro.shiftKey) {
          // console.log("run this macro", macro)
          let insertAt = event.target.value.length

          if (event.target && event.target.selectionStart) {
            insertAt = event.target.selectionStart
          }
          let inputV
          if (event.target) {
            inputV = event.target
          } else {
            console.warn("ERROR: Field not found")
            return false
          }
          if (!macro.combining) {
            // there is behavior where if it is a digit shortcut the numerial is still sent
            // so if thats the case remove the last digit from the value
            if (event.code.includes('Digit')) {
              // if it is in fact a digit char then remove it
              if (inputV.value.charAt(insertAt) == event.code.replace('Digit', '')) {
                // remove the last char
                // inputV.value = inputV.value.slice(0, -1);
                inputV.value = inputV.value.slice(0, insertAt) + inputV.value.slice(insertAt)
                // this.searchValueLocal = inputV.value

                // this.subjectString = inputV.value
                // this.doSearch()

              }
            }
            // same for euqal key
            if (event.code == 'Equal') {
              if (inputV.value.charAt(inputV.value.length - 1) == '=') {
                // remove the last char
                // inputV.value = inputV.value.slice(0, -1);
                inputV.value = inputV.value.slice(0, insertAt) + inputV.value.slice(insertAt)
                // this.searchValueLocal = inputV.value

                // this.subjectString = inputV.value
                // this.doSearch()
              }
            }
            // same for Backquote key

            if (event.code == 'Backquote') {
              if (inputV.value.charAt(inputV.value.length - 1) == '`') {
                // remove the last char
                // inputV.value = inputV.value.slice(0, -1);
                inputV.value = inputV.value.slice(0, insertAt) + inputV.value.slice(insertAt)
                // this.searchValueLocal = inputV.value

                // this.subjectString = inputV.value
                // this.doSearch()
              }
            }
            // it is not a combining unicode char so just insert it into the value
            if (inputV.value) {
              // inputV.value=inputV.value+macro.codeEscape
              inputV.value = inputV.value.substring(0, insertAt) + macro.codeEscape + inputV.value.substring(insertAt);
              // this.searchValueLocal = inputV.value

              // this.subjectString = inputV.value
              if (insertAt) {
                this.$nextTick(() => {
                  inputV.setSelectionRange(insertAt + 1, insertAt + 1)
                  this.$nextTick(() => {
                    inputV.focus()
                    // this.doSearch()
                  })
                })
              } else {
                this.$nextTick(() => {
                  inputV.focus()
                })
              }
            } else {
              inputV.value = macro.codeEscape
              // this.searchValueLocal = inputV.value

              // this.subjectString = inputV.value
            }


          } else {


            // same for Backquote key

            if (event.code == 'Backquote') {

              if (inputV.value.charAt(inputV.value.length - 1) == '`') {
                // remove the last char
                inputV.value = inputV.value.slice(0, -1);
                // this.searchValueLocal = inputV.value
                // this.subjectString = inputV.value
                // this.doSearch()
              }

            }


            // little cheap hack here, on macos the Alt+9 makes ª digits 1-0 do this with Alt+## but we only
            // have one short cut that uses Alt+9 so just remove that char for now
            inputV.value = inputV.value.replace('ª', '')

            inputV.value = inputV.value.substring(0, insertAt) + macro.codeEscape + inputV.value.substring(insertAt);
            // inputV.value=inputV.value+macro.codeEscape

            inputV.setSelectionRange(insertAt + 1, insertAt + 1)
            inputV.focus()


            if (insertAt) {
              this.$nextTick(() => {
                inputV.setSelectionRange(insertAt + 1, insertAt + 1)
                // this.searchValueLocal = inputV.value
                // this.subjectString = inputV.value
                this.$nextTick(() => {
                  inputV.focus()
                })

              })
            } else {

              this.$nextTick(() => {
                inputV.focus()
              })

            }
          }

          event.preventDefault()
          event.stopPropagation()
          return false
        }
      }



    },

    // Load the context when navigation with the keyboard
    loadContext: async function (pickPostion) {
      if (this.pickCurrent == null) {
        this.pickPostion = pickPostion
      } else {
        return null
      }

      if (this.pickLookup[this.pickPostion].literal) {
        return false
      }

      this.getContext()

      if (this.contextData) {
        this.localContextCache[this.contextData.uri] = JSON.parse(JSON.stringify(this.contextData))
      }
    },

    selectContext: async function (pickPostion, update = true) {
	  console.info('selectContext: ', pickPostion, "--", this.pickLookup[this.pickPostion])
      if (pickPostion != null) {
        this.pickPostion = pickPostion
        this.pickCurrent = pickPostion
        this.getContext()
        //Science—Experiments
      } else if (this.pickPostion != null){
        this.getContext()
      }

      if (this.pickLookup[this.pickPostion].complex) {
        // if it is a complex authorized heading then just replace the whole things with it, sometimes
        let splitString = this.subjectString.split('--')
        let splitStringLower = this.subjectString.toLowerCase().split('--')

        // if the selected heading is made of parts of the search string
        let replacePos = []

        if (this.searchStringPos > 0) { // we're looking at a subdivision and we've got a complex heading. Figure out if the pieces
          replacePos = [this.searchStringPos]
          let incomingPieces = this.pickLookup[this.pickPostion].label.toLowerCase().split("‑‑")

          let looksLikeMatch = (set1, set2) => {
            let matches = []
            if (set1.length != set2.length) {
              return false
            } else {
              for (let idx in set1) {
                if (set2[idx].includes(set1[idx])) {
                  matches.push(true)
                } else {
                  matches.push(false)
                }
              }
            }

            return matches.every(v => v === true)

          }

          // Figure out how the select term fits into the existing term.
          if (splitStringLower.length != incomingPieces.length) {
            for (let termIdx in incomingPieces) {

              //check if the next piece is in the incoming
              if (incomingPieces[termIdx].includes(splitStringLower[this.searchStringPos + 1])) {
                replacePos.push(this.searchStringPos + 1)
              }
              //check if the prev piece is in the incoming
              else if (incomingPieces[termIdx].includes(splitStringLower[this.searchStringPos - 1])) {
                replacePos.unshift(this.searchStringPos - 1)
              }
            }
          } else if (splitStringLower.length == incomingPieces.length) {
            if (splitStringLower.at(-1) == incomingPieces.at(0)) {
              // we're appending, so we just want to replace the last piece of the current string
              replacePos.push(splitStringLower.length - 1)
            } else if (looksLikeMatch(splitStringLower, incomingPieces)) {
              replacePos = []
            } else { // same length, first and last don't match, and the arrays don't last.
              //should something happen?
            }

          } else {
            replacePos = []
          }
        }

        if (splitStringLower.includes(this.pickLookup[this.pickPostion].label.replaceAll('-', '‑').toLowerCase())) {
          let idx = splitStringLower.indexOf(this.pickLookup[this.pickPostion].label.replaceAll('-', '‑').toLowerCase())
          if (idx == this.activeComponentIndex) {
            splitString[this.activeComponentIndex] = this.pickLookup[this.pickPostion].label.replaceAll('-', '‑')
            this.subjectString = splitString.join('--')
          }
        } if (replacePos.length > 0) {
          splitString.splice(replacePos[0], replacePos.length, this.pickLookup[this.pickPostion].label)
          this.subjectString = splitString.join('--')
          this.activeComponentIndex = replacePos[0]
        } else {
          // Replace the whole thing
          this.subjectString = this.pickLookup[this.pickPostion].label
          this.componetLookup = {}
          this.activeComponentIndex = 0
        }

        this.componetLookup[this.activeComponentIndex] = {}

        this.componetLookup[this.activeComponentIndex][this.pickLookup[this.pickPostion].label] = this.pickLookup[this.pickPostion]

        // set the type at the top for consistency
        this.componetLookup[this.activeComponentIndex][this.pickLookup[this.pickPostion].label].type = this.pickLookup[this.pickPostion].extra.type

        for (let k in this.pickLookup) {
          this.pickLookup[k].picked = false
        }
        // complex headings are all topics (...probably)
        this.components[this.activeComponentIndex].type = 'madsrdf:Topic'
        this.pickLookup[this.pickPostion].picked = true

        //This check is needed to prevent falling into recursive loop when loading
        // existing data.
        if (update == true) {
          this.subjectStringChanged()
        }

        try {
          this.$refs.subjectInput.focus()
        } catch (err) {
          console.log("working with existing data: $refs")
        }
		// TODO: else if .entity, do something to replace the subject string and selection, without being unable to go back. How?
      } else {
		console.info("else")
        // console.log('1',JSON.parse(JSON.stringify(this.componetLookup)))
        // take the subject string and split
        let splitString = this.subjectString.split('--')
		console.info("splitString: ", splitString)

        // if the incoming subject can replace the whole subject string, do that
        if (!this.pickLookup[this.pickPostion].literal && this.pickLookup[this.pickPostion].suggestLabel.includes(this.subjectString + " (USE ")){
          if(splitString.length == 2 ){
            this.activeComponentIndex = 0  // is this reliable?
            splitString.pop()
          }
        }

        // replace the string with what we selected
        splitString[this.activeComponentIndex] = this.pickLookup[this.pickPostion].label.replaceAll('-', '‑')

        this.subjectString = splitString.join('--')

        if (!this.componetLookup[this.activeComponentIndex]) {
          this.componetLookup[this.activeComponentIndex] = {}
        }

        this.componetLookup[this.activeComponentIndex][this.pickLookup[this.pickPostion].label.replaceAll('-', '‑')] = this.pickLookup[this.pickPostion]

        for (let k in this.pickLookup) {
          this.pickLookup[k].picked = false
        }

        this.pickLookup[this.pickPostion].picked = true

        let type = null
        try {
          type = this.pickLookup[this.pickPostion].extra.type //"madsrdf:" +  ... .rdftypes[0]
          if (typeof type == 'undefined'){
            type = null
          }
          this.componetLookup[this.activeComponentIndex][this.pickLookup[this.pickPostion].label.replaceAll('-', '‑')].type = type
          // this.updateAvctiveTypeSelected
        } catch(err){
          type = null
          console.error("Couldn't get type: ", err)
        }

        if (Object.keys(this.componetLookup[this.activeComponentIndex]).length > 1){
          let keys = Object.keys(this.componetLookup[this.activeComponentIndex])
          let deleteTargets = []
          for (let k of keys){
            if (k != this.pickLookup[this.pickPostion].label.replaceAll('-', '‑')){
              deleteTargets.push(k)
            }
          }
          for (let t of deleteTargets){
            delete this.componetLookup[this.activeComponentIndex][t]
          }
        }

        // console.log('2',JSON.parse(JSON.stringify(this.componetLookup)))
        //Need something to prevent recursion
        if (update == true) {
          this.subjectStringChanged()
        }
      }

      this.$refs.subjectInput.focus()

    },


    navInput: function (event) {
      if (event.key == 'ArrowUp') {
        if (parseInt(this.pickPostion) <= this.searchResults.names.length * -1) {
          return false
        }

        this.pickCurrent = null //allows keyboard selection
        this.loadContext(parseInt(this.pickPostion) - 1)
        this.pickCurrent = parseInt(this.pickPostion)
        event.preventDefault()
        return false
      } else if (event.key == 'ArrowDown') {

        if (parseInt(this.pickPostion) >= this.searchResults.subjectsSimple.length - 1 + this.searchResults.subjectsComplex.length) {
          return false
        }

        this.pickCurrent = null //allows keyboard selection
        this.loadContext(parseInt(this.pickPostion) + 1)
        this.pickCurrent = parseInt(this.pickPostion)
        event.preventDefault()
        return false
      } else if (event.key == 'Enter') {
        if (event.shiftKey) {
          if (!this.okayToAdd) {
            alert('Something is missing. Make sure all elements in the heading are green.')
            return
          }
          this.add()
          return
        }
        this.selectContext()

      } else if (event.ctrlKey && event.key == "1") {
        this.searchModeSwitch("LCSHNAF")
      } else if (event.ctrlKey && event.key == "2") {
        this.searchModeSwitch("CHILD")
      } else if (event.ctrlKey && event.key == "3") {
        this.searchModeSwitch("GEO")
      } else if (event.ctrlKey && event.key == "4") {
        this.searchModeSwitch("HUBS")
      } else if (event.ctrlKey && event.key == "5") {
        this.searchModeSwitch("ENTITIES")
      } else if ((this.searchMode == 'GEO' || this.searchMode == 'ENTITIES') && event.key == "-") {
        if (this.components.length > 0) {
          let lastC = this.components[this.components.length - 1]

          // if the last component has a URI then it was just selected
          // so we are not in the middle of a indirect heading, we are about to type it
          // so let them put in normal --. Unless the last piece was geographic. Then they
          // may have selected the first part from LCSH/LCNAF
          if (lastC.uri && this.activeComponentIndex == this.components.length - 1 && lastC.type != 'madsrdf:Geographic') {
            return true
          }

          // if the last string is a normal "-" then make this one normal too
          if (this.subjectString.slice(-1) == '-') {
            return true
          }

        }

        let start = event.target.selectionStart
        let end = event.target.selectionEnd
        // console.log(this.subjectString.substring(0,start),'|',this.subjectString.substring(end,this.subjectString.length))

        this.subjectString = this.subjectString.substring(0, start) + '‑' + this.subjectString.substring(end, this.subjectString.length)
        this.subjectString = this.subjectString.trim()

        this.$nextTick(() => {
          // console.log(start,end)
          if (end - start > 0) {
            event.target.setSelectionRange(start + 1, start + 1)
          } else {
            event.target.setSelectionRange(start + 1, end + 1)
          }

        })

        this.subjectStringChanged(event)

        event.preventDefault()
        return false

      } else {
        // they might be trying to insert a diacritic here

        // This mode is they press Crtl+e to enter diacritic macro mode, so they did that on the last kedown and now we need to act on the next keystroke and interpret it as a macro code
        if (this.nextInputIsVoyagerModeDiacritics) {
          // they are pressing shift in about to press antoher macro shrotcut
          if (event.key == 'Shift') {
            return false
          }

          if (this.diacriticPacks.voyager[event.code]) {
            let useMacro
            for (let macro of this.diacriticPacks.voyager[event.code]) {
              if (macro.shiftKey == event.shiftKey) {
                useMacro = macro
                break
              }
            }

            let inputV = event.target
            let insertAt = event.target.value.length
            if (event.target && event.target.selectionStart) {
              insertAt = event.target.selectionStart
            }

            if (!useMacro.combining) {
              // it is not a combining unicode char so just insert it into the value
              if (inputV.value) {
                // inputV.value=inputV.value+useMacro.codeEscape
                inputV.value = inputV.value.substring(0, insertAt) + useMacro.codeEscape + inputV.value.substring(insertAt);
              } else {
                inputV.value = useMacro.codeEscape
              }
              // this.searchValueLocal = inputV.value

            } else {
              // inputV.value=inputV.value+useMacro.codeEscape
              inputV.value = inputV.value.substring(0, insertAt) + useMacro.codeEscape + inputV.value.substring(insertAt);
              // this.searchValueLocal = inputV.value

            }

            if (insertAt) {
              this.$nextTick(() => {
                inputV.setSelectionRange(insertAt + 1, insertAt + 1)
                // this.searchValueLocal = inputV.value

                this.$nextTick(() => {
                  inputV.focus()
                })

              })
            } else {
              this.$nextTick(() => {
                inputV.focus()
              })
            }

            // manually change the v-model var and force a update
            this.$nextTick(() => {
              this.subjectString = inputV.value
              this.subjectStringChanged()
              this.navString({ key: 'ArrowRight' })
            })


          }
          // turn off mode
          this.nextInputIsVoyagerModeDiacritics = false
          event.target.style.removeProperty('background-color')
          event.preventDefault()
          return false
        }
        // all macros use the ctrl key
        if (event.ctrlKey == true) {
          if (this.diacriticUse.length > 0) {
            for (let macro of this.diacriticUseValues) {
              if (event.code == macro.code && event.ctrlKey == macro.ctrlKey && event.altKey == macro.altKey && event.shiftKey == macro.shiftKey) {
                // console.log("run this macro", macro)
                event.preventDefault()
                this.runMacroExpressMacro(event)

                // manually change the v-model var and force a update
                this.$nextTick(() => {
                  this.subjectString = event.target.value
                  this.subjectStringChanged()
                  this.navString({ key: 'ArrowRight' })
                })
                //

                return false

              }
            }
          }

          // they are entering into voyager diacritic mode
          if (event.code == 'KeyE') {
            if (!this.preferenceStore.returnValue('--b-diacritics-disable-voyager-mode')) {
              event.target.style.backgroundColor = "chartreuse"
              this.nextInputIsVoyagerModeDiacritics = true
              event.preventDefault()
              return false
            }

          }
          //
        }
      }



    },

    updateAvctiveTypeSelected: function () {
      //set them all false
      for (let k in this.activeTypes) {
        this.activeTypes[k].selected = false
      }

      if (this.activeComponent && this.activeComponent.type) {
        if (this.activeTypes[this.activeComponent.type]) {
          this.activeTypes[this.activeComponent.type].selected = true
        } else if (this.activeComponent.type == 'madsrdf:HierarchicalGeographic') {
          this.activeTypes["madsrdf:Geographic"].selected = true
        } else {
          this.activeTypes["madsrdf:Topic"].selected = true
        }
      }
    },

    setTypeClick: function (event, type) {
      // this happens with literals, componentLookup needs to get the type
      this.activeComponent.type = type
      this.activeTypes[type].selected = true
      this.componetLookup[this.activeComponentIndex][this.pickLookup[this.pickPostion].label.replaceAll('-', '‑')].type = type

      this.subjectStringChanged() // without this the active selection won't show any indication
      this.$refs.subjectInput.focus()
    },

    renderHintBoxes: function () {
      // wait for the UI to render
      this.$nextTick(() => {
        // loop through the current components
        let activeLeft = 0
        for (let com of this.components) {
          // set the left
          this.$nextTick(() => {
            if (this.$refs['cBackground' + com.id] && this.$refs['cBackground' + com.id][0]) {
              this.$refs['cBackground' + com.id][0].style.left = `${activeLeft}px`
              // add the width of all the existing components to the var
              // add 12 to accomodate the "--" seperator
              activeLeft = activeLeft + this.$refs['cBackground' + com.id][0].offsetWidth + 11
            }
          })
        }
      })

    },

    validateOkayToAdd: function () {
      this.okayToAdd = false
      let allHaveURI = true
      let allHaveType = true

      for (let c of this.components) {
        if (!c.uri && !c.literal) {
          allHaveURI = false
        }
        if (!c.type) {
          allHaveType = false
        }

      }

      if (allHaveURI && allHaveType) {
        this.okayToAdd = true
      }
      if (allHaveURI && !allHaveType && this.components.length == 1) {
        this.okayToAdd = true
      }



    },

    subjectStringChanged: async function (event) {
      this.subjectString = this.subjectString.replaceAll("—", "--")
      this.validateOkayToAdd()

      //fake the "click" so the results panel populates
      if (this.initialLoad == true) {
        let pieces = this.$refs.subjectInput.value.replace("—", "--").split("--")
        let lastPiece = pieces.at(-1)
        this.searchApis(lastPiece, this.$refs.subjectInput.value.replace("—", "--"), this)
        this.initialLoad = false
      }

      if (event) {
        this.searchResults = null
      }

      // this.showTypes = true
      // Only show when there's a literal selected
      try {
        this.showTypes = this.pickLookup[this.pickPostion].literal && this.pickLookup[this.pickPostion].picked
      } catch { }

      // if they erase everything remove the components
      if (this.subjectString.length == 0) {
        this.activeComponent = null
        this.activeComponentIndex = 0
        this.componetLookup = {}
        this.components = []

        //search for nothing. Otherwise, if the user deletes their search
        // quickly, it will end up searcing on the last letter to be deleted
        this.searchApis("", "", this)
      }

      if (!this.subjectString.endsWith("--")) {
        this.buildComponents(this.subjectString)
      }

      this.renderHintBoxes()


      // if they are typing in the heading select it as we go
      if (event) {
        for (let c of this.components) {
          if (event.target.selectionStart >= c.posStart && event.target.selectionStart <= c.posEnd + 1) {
            this.activeComponent = c
            this.activeComponentIndex = c.id

            // it is not empty
            // it dose not end with "-" so it the '--' typing doesn't trigger
            if (c.label.trim() != '' && !c.label.endsWith('-')) {
              this.searchApis(c.label, event.target.value, this)

              // BUT if it ends with a number and - then it is a name with open life dates
              // so do look that one up
            } else if (/[0-9]{4}\??-/.test(c.label)) {
              this.searchApis(c.label, event.target.value, this)
            } else if (/,\s[0-9]{4}-/.test(c.label)) {
              this.searchApis(c.label, event.target.value, this)
            }
            //            // BUT if it starts with
            break
          }
        }
      } else {

        // if there is no event this was triggered from code
        // so the current active component is the one we need to update with anything changed
        // which would likely be the type if not a keyboard event

        this.activeComponent = this.components[this.activeComponentIndex]
      }

      this.updateAvctiveTypeSelected()

      if (this.components.length == 1 && this.components[0].complex) {
        this.showTypes = false

      }

      this.validateOkayToAdd()

    },

    /**
    * Emits the components back to the complex component to add to the system
    * uses this.linkModeResults
    * @return {void}
    */
    // Can link mode be stripped out?
    addLinkMode: function () {


      let sendResults = []

      // console.log(this.linkModeResults)


      if (this.linkModeResults) {


        if (this.linkModeResults.resultType && this.linkModeResults.resultType === 'COMPLEX') {
          sendResults.push({
            complex: true,
            id: 0,
            label: this.linkModeResults.hit.label,
            literal: false,
            posEnd: 0,
            posStart: 0,
            type: "madsrdf:Topic",
            uri: this.linkModeResults.hit.uri
          })

        } else {
          for (const [i, v] of this.linkModeResults.hit.entries()) {
            sendResults.push({
              complex: false,
              id: i,
              label: v.label,
              literal: v.literal,
              posEnd: 0,
              posStart: 0,
              type: v.heading.rdfType.replace('http://www.loc.gov/mads/rdf/v1#', 'madsrdf:'),
              uri: v.uri
            })
          }
        }




      }

      // console.log("sendResults",sendResults)

      this.$emit('subjectAdded', sendResults)

      // depreciated: false
      // extra: ""
      // heading: Object
      //   label: "Woolf, Virginia, 1882-1941"
      //   primary: true
      //   rdfType: "http://www.loc.gov/mads/rdf/v1#PersonalName"
      //   subdivision: false
      //   type: "a"
      // label: "Woolf, Virginia, 1882-1941"
      // literal: false
      // suggestLabel: "Woolf, Virginia, 1882-1941"
      // uri: "http://id.loc.gov/authorities/names/n79041870"
      // vlabel: ""


      // -----------

      // console.log("ADDDD")
      // complex: false
      // id: 2
      // label: "20th century"
      // literal: false
      // posEnd: 47
      // posStart: 36
      // type: "madsrdf:Temporal"
      // uri: "http://id.loc.gov/authorities/subjects/sh2002012476"


      // complex: false
      // id: 1
      // label: "19999"
      // literal: true
      // posEnd: 29
      // posStart: 25
      // type: "madsrdf:Temporal"
      // uri: null

      // complex: true
      // id: 0
      // label: "Archaeology and history--United States"
      // literal: false
      // posEnd: 37
      // posStart: 0
      // type: "madsrdf:Topic"
      // uri: "http://id.loc.gov/authorities/subjects/sh2009115324"


    },

    getTypeFromSubfield: function (subfield) {
      switch (subfield) {
        case ("$a"):
          subfield = "madsrdf:Topic"
          break
        case ("$x"):
          subfield = "madsrdf:Topic"
          break
        case ("$v"):
          subfield = "madsrdf:GenreForm"
          break
        case ("$y"):
          subfield = "madsrdf:Temporal"
          break
        case ("$z"):
          subfield = "madsrdf:Geographic"
          break
        default:
          subfield = false
      }

      return subfield
    },

    add: async function () {
      //remove any existing thesaurus label, so it has the most current
      //this.profileStore.removeValueSimple(componentGuid, fieldGuid)

      // console.log('this.components',JSON.parse(JSON.stringify(this.components)))
      // remove our werid hyphens before we send it back
      for (let c of this.components) {
        c.label = c.label.replaceAll('‑', '-')
      }

      // If the individual components together, match a complex subject, switch'em so the user ends up with a controlled term
      let match = false
      const componentCount = this.components.length
      const componentCheck = this.components.length > 0 ? this.components.map((component) => component.label).join("--") : false
      let componentTypes
      try {
        componentTypes = this.components.length > 0 ? this.components.map((component) => component.marcKey.slice(5)).join("") : false
      } catch {
        componentTypes = false
      }

      let complexSubjects = this.searchResults["subjectsComplex"].concat(this.searchResults["subjectsChildrenComplex"])

      // Determine if the built heading matches a complex subject, replace the individual pieces with 1 heading if possible
      for (let el in complexSubjects) {
        let target = complexSubjects[el]
        if (target.label.replaceAll("‑", "-") == componentCheck && target.depreciated == false) {
          // we need to check the types of each element to make sure they really are the same terms
          // let targetContext = await utilsNetwork.returnContext(target.uri)
          let targetContext = target.extra

          let marcKey = ""
          if (Array.isArray(targetContext.marcKeys) && typeof targetContext.marcKeys[0] == 'string') {
            marcKey = targetContext.marcKeys[0]
          } else if (targetContext.marcKey) {
            marcKey = targetContext.marcKey
          }

          if (marcKey.slice(5) == componentTypes) {
            //the entire built subject can be replaced by 1 term
            match = true
            this.components.push({
              "complex": target.complex,
              "id": 0,
              "label": target.label,
              "literal": false,
              "posEnd": target.label.length,
              "posStart": 0,
              "type": "madsrdf:Topic",
              "uri": target.uri,
              "marcKey": marcKey
            })
          }
        }
      }

      let newComponents = []

      const frozenComponents = JSON.parse(JSON.stringify(this.components))

      //remove unused components
      if (match) {
        Array(componentCount).fill(0).map((i) => this.components.shift())
      }
      else {
        // need to break up the complex heading into it's pieces so their URIs are availble
        let prevItems = 0
        let allComplex = frozenComponents.every(c => c.complex)
        for (let component in frozenComponents) {
          const target = frozenComponents[component]
          if (frozenComponents.length > 1 && !(['madsrdf:Geographic', 'madsrdf:HierarchicalGeographic', 'http://www.loc.gov/mads/rdf/v1#HierarchicalGeographic'].includes(target.type)) && target.complex) {
            let uri = target.uri
            let data = false //await this.parseComplexSubject(uri)  //This can take a while, and is only need for the URI, but lots of things don't have URIs
            if (uri) {
              data = await this.parseComplexSubject(uri)
            } else {
              data = target
            }

            let subs
            subs = target.marcKey.slice(5)
            // subfields = subfields.match(/\$./g)
            subs = subs.match(/\$[axyzv]{1}/g)
            const complexLabel = target.label
            // build the new components
            let id = prevItems
            let labels = complexLabel.split("--")

            for (let idx in labels) {
              let subfield
              if (data) {
                subfield = data["subfields"][idx]
              } else if (target.marcKey) {
                let marcKey = target.marcKey.slice(5)
                subfield = marcKey.match(/\$[axyzv]{1}/g)
                subfield = subfield[idx]
              }
              subfield = this.getTypeFromSubfield(subfield)

              // Override the subfield of the first element based on the marc tag
              let tag = target.marcKey.slice(0, 3)
              if (idx == 0) {
                switch (tag) {
                  case "151":
                    subfield = "madsrdf:Geographic"
                    break
                  case "100":
                    subfield = "madsrdf:PersonalName"
                    break
                  case "185":
                    subfield = "madsrdf:GenreForm"
                    break
                  default:
                    subfield = "madsrdf:Topic"
                }
              }

              // make a marcKey for the component
              // We've got the label, subfield and the tag for the first element
              let sub
              if (data) {
                sub = data["subfields"][idx]
              } else {
                sub = subs[idx]
              }
              if (idx == 0) {
                tag = tag
              } else {
                // build the tag from the subfield
                switch (sub) {
                  case ("$v"):
                    tag = "185"
                    break
                  case ("$y"):
                    tag = "182"
                    break
                  case ("$z"):
                    tag = "181"
                    break
                  default:
                    tag = "180"
                }
              }
              let marcKey = tag + "  " + sub + labels[idx]

              let uriId = idx

              // Adjust the ID to account for shifts as things are added/removed compared to the starting subjectHeading
              // if (target.uri.includes("childrensSubjects/sj") && target.id > 0){
              //   uriId = uriId - frozenComponents.filter((c) => !c.complex).length
              // }

              newComponents.splice(id, 0, ({
                "complex": false,
                "id": id,
                "label": labels[idx],
                "literal": false,
                "posEnd": labels[idx].length,
                "posStart": 0,
                "type": subfield,
                "uri": data && data["components"] && data["components"][0]["@list"][uriId]["@id"].startsWith("http") ? data["components"][0]["@list"][uriId]["@id"] : "",
                "marcKey": marcKey,
                "fromComplex": true,
                "complexMarcKey": target.marcKey
              }))
              id++
              prevItems++
            }

          } else {
            newComponents.push(target)
            prevItems++
          }
        }
      }


      if (newComponents.length > 0) {
        this.components = newComponents
      }

      this.$emit('subjectAdded', this.components)
    },


    closeEditor: function () {
      //after closing always open in `build` mode
      this.subjectEditorMode = "build"

      //clear out the components and related field so things will start clean if it reopened
      this.cleanState()

      this.$emit('hideSubjectModal', true)
    },

    checkToolBarHeight: function () {
      // also check to see if the toolbar is off the screen,
      // in very very low res setups sometimes this area gets clipped
      if (this.$refs.toolbar && this.$refs.toolbar.getBoundingClientRect().bottom > window.innerHeight) {
        this.lowResMode = true
        this.$emit('lowResModeActivate', true)
      }
    },

    cleanState: function () {
      this.searchMode = "LCSHNAF"
      this.components = []
      this.lookup = {}
      this.searchResults = null
      this.activeSearch = false
      this.pickPostion = 0
      this.pickLookup = {}
      this.activeComponent = null
      this.oldActiveComponent = null
      this.activeComponentIndex = 0
      this.oldActiveComponentIndex = 99
      this.contextRequestInProgress = false
      this.componetLookup = {}
      this.nextInputIsTypeSelection = false
      this.okayToAdd = false
      this.showTypes = false

      this.contextData = { nodeMap: {} }
      this.authorityLookupLocal = null,
        this.subjectString = ''

    },


    loadUserValue: function () {
      // reset things if they might be opening this again for some reason
      this.cleanState()
    },

    loadNacoStubModal: function() {
        // Set the current value for NAR creation
        this.lastComplexLookupString = this.subjectString
        // store the info needed to pass to the process
        this.activeNARStubComponent = {
          type: 'lookupComplex',
          guid: this.guid,
          fieldGuid: null,
          structure: this.structure,
          propertyPath:this.propertyPath,
          source: "subject"
        }

        this.$emit('hideComplexModal')
        this.$nextTick(() => {
          this.showNacoStubCreateModal = true
        })
      },

      displayProvisonalNAR: function(){
        if (this.activeComponent && !this.activeComponent.literal){ return false }
        if (!useConfigStore().returnUrls.displayLCOnlyFeatures){ return false}
        if (this.structure && this.structure.valueConstraint && this.structure.valueConstraint.useValuesFrom && this.structure.valueConstraint.useValuesFrom.length>0 && this.structure.valueConstraint.useValuesFrom.join(' ').indexOf('id.loc.gov/authorities/subjects')>-1){
          return true
        }
        return false
      },
  },

  created: function () {
    this.loadUserValue()
  },
  before: function () { },
  mounted: function () { },


  updated: function () {
    // preselect the search type, if a children's subject
    if (this.searchType.includes("Childrens")) {
      this.searchMode = "CHILD"
    } else {
      this.searchMode = "LCSHNAF"
    }
    // this was opened from an existing subject
    let profileData = this.profileData

    let incomingSubjects

    if (profileData && profileData.propertyLabel != "Subjects") {
      incomingSubjects = false
    } else if (profileData) {
      try {
        if (
          profileData["userValue"]["http://id.loc.gov/ontologies/bibframe/subject"][0]["http://www.loc.gov/mads/rdf/v1#componentList"]
          && !profileData["userValue"]["http://id.loc.gov/ontologies/bibframe/subject"][0]["http://id.loc.gov/ontologies/bflc/marcKey"]
        ) {
          incomingSubjects = profileData["userValue"]["http://id.loc.gov/ontologies/bibframe/subject"][0]["http://www.loc.gov/mads/rdf/v1#componentList"]
        } else {
          incomingSubjects = profileData["userValue"]["http://id.loc.gov/ontologies/bibframe/subject"][0]
        }
      } catch (err) {
        incomingSubjects = false
      }
    }

    let searchValue = this.searchValue
    if (!searchValue) { return }
    searchValue = searchValue.replaceAll("—", "--")

    if (searchValue.includes("---")) {
      searchValue = searchValue.replace("---", "‑--")
    }

    //When there is existing data, we need to make sure that the number of components matches
    // the number subjects in the searchValue
    if (searchValue && this.components.length != searchValue.split("--").length && !searchValue.endsWith('--')) {
      this.buildLookupComponents(incomingSubjects)
      this.buildComponents(searchValue)
      this.initialLoad = false
      this.subjectStringChanged()
      this.activeComponentIndex = 0
      this.activeComponent = this.components[this.activeComponentIndex]
    }

    // this supports loading existing information into the forms
    if (this.authorityLookup != null) {
      this.authorityLookupLocal = this.authorityLookup.replaceAll("—", "--")
      this.subjectInput = this.authorityLookupLocal
      this.linkModeString = this.authorityLookupLocal
      try {
        //Performs the search for linkmode
        this.linkModeTextChange({ key: 'Enter', shiftKey: false })

        //Do the search for build mode
        this.searchResults = this.searchApis(this.components[0].label, this.authorityLookupLocal, this)

        //Wait for the search results
        this.searching = true
        setTimeout(() => {
          //Make sure the search result that matche
          let list = null
          if (this.searchResults != null) {
            if (this.isLiteral) {
              list = this.searchResults.subjectsSimple
            } else {
              list = this.searchResults.subjectsComplex
            }
          }

          //Select the context that matches the incoming value
          for (const pos in list) {
            let label = list[pos].label
            if (this.authorityLookupLocal && label.replace(/\W/g, ' ') == this.authorityLookupLocal.replace(/\W/g, ' ')) {
              try {
                let idx = 0
                if (this.isLiteral == true) {
                  idx = this.searchResults.subjectsComplex.length + Number(pos)
                } else {
                  idx = pos
                }
                if (!this.fromPaste) {
                  this.selectContext(idx, false)
                  this.validateOkayToAdd()
                }
              } catch (err) {
                console.error(err)
              }
              break
            }
          }

        }, (2 * 1000)
        )
        this.searching = false
      } catch (err) {
        console.log("Error: ", err)
      }

      this.renderHintBoxes()
      //this.subjectStringChanged()
      //this.validateOkayToAdd()
    }
  }
};

</script>
