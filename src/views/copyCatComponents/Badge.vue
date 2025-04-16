<template>
    <span :class="[
        'badge',
        {'badge-primary': badgeType == 'primary'},
        {'badge-secondary': badgeType == 'secondary'},
        {'badge-success': badgeType == 'success'},
        {'badge-warning': badgeType == 'warning'},
        {'badge-danger': badgeType == 'danger'},
        {'badge-info': badgeType == 'info'},
        {'simptip-position-top': tipPos == 'top'},
        {'simptip-position-bottom': tipPos == 'bot'},
        {'simptip-position-left': tipPos == 'left'},
        {'simptip-position-right': tipPos == 'right'},
        {'no-hover': noHover}
    ]"
    :data-tooltip="toolTip"
    >{{ text }}</span>
</template>


<script>

import { usePreferenceStore } from '@/stores/preference'
import { mapStores, mapState, mapWritableState } from 'pinia'


export default{
    name: 'CopyCatCard',
    props: {
        text: String,
        badgeType: String,
        noHover: Boolean,
        toolTip: String,
        tipPos: String,
    },
    data(){
      return {}
    },
    computed: {},
    methods:{},
}
</script>

<style>

.badge {
    display: inline-block;
    padding: .25em .4em;
    font-size: 75%;
    font-weight: 700;
    line-height: 1;
    text-align: center;
    white-space: nowrap;
    vertical-align: baseline;
    border-radius: .25rem;
    margin-right: 6px;
    text-wrap: auto;
  }

  .badge-primary {
    color: #fff;
    background-color: #007bff;
  }

  .badge-secondary {
    color: white;
    background-color: #6c757d;;
  }

  .badge-success {
    color: #fff;
    background-color: #28a745;
  }

  .badge-warning {
    color: #212529;
    background-color: #ffc107;
  }

  .badge-danger {
    color: #fff;
    background-color: #dc3545;
  }

  .badge-info {
    color: #fff;
    background-color: #17a2b8;
  }

  .badge:hover {
    cursor: help;
    background-color: black !important;
    color: white;
  }

  .badge.no-hover {
    pointer-events: none;
  }

</style>
