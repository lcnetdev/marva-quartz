<template>
 <span class="trigger-open">{{displayLabelValue}}</span>
</template>

<script>
import { useConfigStore } from '@/stores/config'

export default {
  name: "EditLabelDereference",
  components: {



  },

  props: {
    URI: String,
  },

  data:function() {
    return {
      displayLabel: ''
    }
  },

  created: function(){},

  computed: {

    displayLabelValue(){
      this.fetchLabel()
      return this.displayLabel
    },


  },



  methods:{

    fetchLabel: function(){
      if (this.URI){
        if (this.URI.startsWith('http://') || this.URI.startsWith('https://') ){

          if (this.URI.includes('id.loc.gov')){

            // if its a instance/work/hub getthe x-pref label from the head request
            if (
                this.URI.includes('/resources/instances/') ||
                this.URI.includes('/resources/works/') ||
                this.URI.includes('/resources/hubs/') ||
                this.URI.includes('/ontologies/bibframe/') ||


                this.URI.includes('/vocabulary/')
              ){

              if (this.URI.endsWith('/')){
                this.URI = this.URI.slice(0, -1)
              }

              let URL = this.URI + '.madsrdf_raw.json' //'.nt'
              URL = URL.replace('http://','https://')

              let cache = sessionStorage.getItem(URL);

              if (cache){

                this.displayLabel = cache

              }else{
                let returnUrls = useConfigStore().returnUrls
                if (returnUrls.env == "production"){
                  URL = URL.replace("//id.", "//preprod-8080.id.")
                }

                let self = this
                fetch(URL, {method: 'HEAD' }).then(
                  function(response)
                    {

                      // an id upgrade enables a ecoded pref-label to be exposed
                      // since the old x-preflabel is not encoded and header vars are not unicode supporting
                      // so use it if avialable
                      let preflabel = response.headers.get("x-preflabel");
                      if (response.headers.get("x-preflabel-encoded")){
                        preflabel = decodeURIComponent(response.headers.get("x-preflabel-encoded"));
                      }

                      if (preflabel){
                        self.displayLabel = preflabel
                        sessionStorage.setItem(URL, preflabel);
                      }
                    }
                  ).catch(function() {

                        // there was something with the request, ignore


                  });


              }





            }else{

              // some common hardcoded values
              if (this.URI == 'http://id.loc.gov/authorities/subjects'){
                this.displayLabel = 'Library of Congress subject headings'
              }



            }



          }else{
              this.displayLabel = this.URI
          }



        }else{
          this.displayLabel = this.URI
        }
      }else{
        this.displayLabel = 'NO URI PASSED?'
      }

    }

  }

};

</script>