<template>
  <span :data-tooltip="useLabel" class="simptip-position-right" v-for="icon in useIcon" >
    <span  :class="['material-icons-outlined',icon]">{{icon}}</span>  
  </span>  
</template>

<script>


export default {
  name: "AuthTypeIcon",
  components: {
  },

  props: {
    type: String,
    passClass:String,

  },

  data:function() {
    return {

    }
  },

  created: function(){


  },

  computed: {

    useLabel(){
      let type = this.type

      type = type.replace('http://www.loc.gov/mads/rdf/v1#','')     

      if (type == 'PersonalName') return "Personal Name"
      if (type == 'CorporateName') return "Corporate Name"
      if (type == 'NameTitle') return "Name Title"
      if (type == 'Title') return "Title"
      if (type == 'ConferenceName') return "Conference Name"
      if (type == 'Geographic') return "Geographic"
      if (type == 'GenreForm') return "Genre Form"
      if (type == 'ComplexSubject') return "Complex Subject"
      if (type == 'Topic') return "Topic Subject"

      if (type == 'Authority') return iconSubjectComplex

      if (type == 'http://id.loc.gov/ontologies/bibframe/Person') return "Personal Name"
      if (type == 'http://id.loc.gov/ontologies/bibframe/Place') return "Geographic"
      if (type == 'http://id.loc.gov/ontologies/bibframe/Topic') return "Topic Subject"
      if (type == 'http://id.loc.gov/ontologies/bibframe/Organization') return  "Corporate Name"
      if (type == 'http://id.loc.gov/ontologies/bibframe/GenreForm') return "Genre Form"

      if (type == 'http://id.loc.gov/ontologies/bibframe/Agent') return "Personal Name"

    },
    

    useIcon(){


      const iconPersonal = ['person_2']
      const iconCorporate = ['corporate_fare']
      const iconTitle = ['title']
      const iconNameTitle = ['title','person_2']
      const iconConference = ['meeting_room']
      const iconGeographic = ['map']
      const iconGenre = ['bookmark']
      const iconSubjectComplex = ['topic']
      const iconSubjectTopic = ['topic','title']



      
 
      if (this.type && typeof this.type === 'string'){
        let type = this.type

        type = type.replace('http://www.loc.gov/mads/rdf/v1#','')

        if (type == 'PersonalName') return iconPersonal
        if (type == 'CorporateName') return iconCorporate
        if (type == 'NameTitle') return iconNameTitle
        if (type == 'Title') return iconTitle
        if (type == 'ConferenceName') return iconConference
        if (type == 'Geographic') return iconGeographic
        if (type == 'GenreForm') return iconGenre
        if (type == 'ComplexSubject') return iconSubjectComplex
        if (type == 'Topic') return iconSubjectTopic

        if (type == 'Authority') return iconSubjectComplex


        if (type == 'http://id.loc.gov/ontologies/bibframe/Person') return iconPersonal
        if (type == 'http://id.loc.gov/ontologies/bibframe/Place') return iconGeographic
        if (type == 'http://id.loc.gov/ontologies/bibframe/Topic') return iconSubjectTopic
        if (type == 'http://id.loc.gov/ontologies/bibframe/Organization') return iconCorporate
        if (type == 'http://id.loc.gov/ontologies/bibframe/GenreForm') return iconGenre



        if (type == 'http://id.loc.gov/ontologies/bibframe/Agent') return iconPersonal


        // if (result.label == 'xxxxxx') return iconPersonal
        // if (result.label == 'xxxxxx') return iconPersonal


      }

      // console.log("no icon slected", this.type )
      return []

    }, 


  },



  methods:{




  }

};

</script>

<style scoped>

/*A custom class passed to style the icon to the context it is being used*/
.complex-lookup-inline{
  

  
}



</style>

