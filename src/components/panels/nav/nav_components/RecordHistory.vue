<template>
    <div class="container" @click="(e) => e.stopPropagation()"> <!-- keep the window open when clicking -->
        <div class="record-id">
            <strong>ID:</strong> <a :href="'https://id.loc.gov/resources/works/' + recordId" target="_blank">{{ recordId
                }}</a>
            <br>
            <strong>Encoding Level:</strong> {{ encLvl }}
            <br>
            <strong>Cataloging Authentication Code(s):</strong> {{ authentication.join(" ") }}
        </div>
        <strong>History</strong>
        <div class="table-container">
            <table class="history">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>EncLvl</th>
                        <th>Type</th>
                        <th>Comment</th>
                        <th>GenProcess</th>
                        <th>Agent</th>
                    </tr>
                </thead>
                <tr v-for="event in adminMetadata">
                    <td>
                        {{ event.date.value }}
                    </td>

                    <td v-if="event.encodingLevel">
                        {{ event.encodingLevel.value }}
                    </td>
                    <td v-else></td>

                    <td v-if="event.label">
                        {{ event.label.value }}
                    </td>
                    <td v-else></td>
                    <td v-if="event.comment">
                        {{ event.comment.value }}
                    </td>
                    <td v-else></td>
                    <td v-if="event.generationProcess">
                        {{ event.generationProcess.value }}
                    </td>
                    <td v-else></td>

                    <td v-if="event.catalogerId">
                        {{ event.catalogerId.value }}
                    </td>
                    <td v-else-if="event.agent">
                        {{ event.agent.value }}
                    </td>
                    <td v-else></td>
                </tr>
            </table>
        </div>

        <div class="nines-container">
            <strong>9XX</strong>
            <table class="nines">
                <tr v-for="nine in nineXX">
                    <td colspan="2">
                        {{ nine }}
                    </td>
                </tr>
            </table>
        </div>
    </div>
</template>

<script>
import utilsNetwork from '@/lib/utils_network'

export default {
    data() {
        return {
            recordId: null,
            adminMetadata: [],
            nineXX: null,
            encLvl: null,
            authentication: [],
            history: {}
        }
    },
    props: {
        item: Object
    },


    methods: {
        getAdminMetadata: async function () {
            let p = this.item.profile
            let work
            for (let rt in p.rt) {
                if (rt.includes(":Work")) {
                    work = p.rt[rt]
                }
            }
            let admin = []
            let nines = []
            for (let pt in work.pt) {
                if (pt.includes('_adminmetadata')) {
                    let target = work.pt[pt]
                    let userValue = target.userValue
                    let data = userValue["http://id.loc.gov/ontologies/bibframe/adminMetadata"][0]
                    let date
                    let status

                    try {
                        status = data["http://id.loc.gov/ontologies/bibframe/status"][0]["http://www.w3.org/2000/01/rdf-schema#label"][0]["http://www.w3.org/2000/01/rdf-schema#label"]
                    } catch {
                        try {
                            for (let thing in data) {
                                if (thing.includes("/d9") && !thing.includes("/d955")) {
                                    nines.push(data[thing][0][thing])
                                }
                            }
                        } catch { }

                        if (Object.keys(data).includes("http://id.loc.gov/ontologies/bibframe/identifiedBy")) {
                            this.recordId = data["http://id.loc.gov/ontologies/bibframe/identifiedBy"][0]["http://www.w3.org/1999/02/22-rdf-syntax-ns#value"][0]["http://www.w3.org/1999/02/22-rdf-syntax-ns#value"]
                        }
                        if (Object.keys(data).includes("http://id.loc.gov/ontologies/bflc/encodingLevel")) {
                            this.encLvl = data["http://id.loc.gov/ontologies/bflc/encodingLevel"][0]["http://www.w3.org/2000/01/rdf-schema#label"][0]["http://www.w3.org/2000/01/rdf-schema#label"]
                        }
                        if (Object.keys(data).includes("http://id.loc.gov/ontologies/bibframe/descriptionAuthentication")) {
                            let authDesc = []
                            for (let auth of data["http://id.loc.gov/ontologies/bibframe/descriptionAuthentication"]) {
                                let id = auth["@id"].split("/").at(-1)
                                authDesc.push(id)
                            }
                            this.authentication = authDesc
                        }

                    }
                }
            }

            this.history = await utilsNetwork.recordHistory(this.recordId)
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(this.history.history.replace(/[\n\r]/g, ''), "text/xml");
            let history = xmlDoc.getElementsByTagName("bf:AdminMetadata")
            for (let h of history){
                let event = {}
                for (let child of h.children){
                    let tag = child.tagName
                    tag = tag.replace(/[a-z]+\:/, '')
                    let rdfResource
                    let value
                    if (child.hasAttribute("rdf:resource")){
                        rdfResource = child.getAttribute('rdf:resource')
                    }
                    if (child.innerHTML){
                        value = child.innerHTML
                    }

                    if (value===undefined){
                        value = rdfResource.split("/").at(-1)
                    }

                    event[tag] = {
                        'value': value,
                        'uri': rdfResource,
                    }

                }
                this.adminMetadata.push(event)

            }


            // this.adminMetadata = admin.sort((a, b) => {
            //     return new Date(a.date) - new Date(b.date)
            // })
            this.nineXX = nines

        }
    },

    mounted() {
        // this.getAdminMetadata()
        window.setTimeout(()=>{
            this.getAdminMetadata() // for menu access
        }, 2000)
    },

}

</script>

<style scoped>
.container {
    padding: 5px;
}

.history {
    border: 1px solid black;
    table-layout: fixed;
    width: 735px;
}

.table-container {
    overflow-y: scroll;
    height: 65vh;
}

.history tr {
    text-align: center;
}
tr th{
    font-weight: bold;
}
tr:nth-child(odd):hover,
tr:hover {
    background-color: rgb(143, 141, 141);
    color: whitesmoke;
}

td {
    word-wrap: anywhere;
}

.nines-container{
    margin-top: 8px;
}


.record-id {
    margin-bottom: 8px;
}

tr:nth-child(odd) {
    background-color: blanchedalmond;
}

strong {
    font-weight: bold;
}



</style>

<style>
#record-panel{
    left: -600px !important;
}
</style>