<template>
    <div class="container">
        <div class="record-id">
            <strong>ID:</strong> <a :href="'https://id.loc.gov/resources/works/' + recordId" target="_blank">{{ recordId
                }}</a>
            <br>
            <strong>Encoding Level:</strong> {{ encLvl }}
            <br>
            <strong>Cataloging Authentication Code(s):</strong> {{ authentication.join(" ") }}
        </div>
        <strong>History</strong>
        <table class="history">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Agent</th>
                    <th>EncLvl</th>
                    <th>Label</th>
                    <th>Comment</th>
                    <th>GenProcess</th>
                    <th>CatID</th>
                </tr>
            </thead>
            <tr v-for="event in adminMetadata">
                <td>
                    {{ event.date.value }}
                </td>
                <td>
                    {{ event.status.value }}
                </td>
                <td v-if="event.agent">
                    {{ event.agent.value }}
                </td>
                <td v-else></td>

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
                <td v-else></td>
            </tr>
        </table>

        <table class="nines">
            <tr v-for="nine in nineXX">
                <td colspan="2">
                    {{ nine }}
                </td>
            </tr>
        </table>
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
                                if (thing.includes("/d9")) {
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
            console.info("@@@@@@", this.history)
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(this.history.history.replace(/[\n\r]/g, ''), "text/xml");
            console.info("xmlDoc: ", xmlDoc)
            let history = xmlDoc.getElementsByTagName("bf:AdminMetadata")
            console.info("history: ", history)
            for (let h of history){
                let event = {}
                // console.info("children: ", h.children)
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

                    console.info("event: ", tag, "--", rdfResource, "--", value)
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
    }
}

</script>

<style scoped>
.container {
    padding: 5px;
}

.history {
    border: 1px solid black;
}

tr:nth-child(odd):hover,
tr:hover {
    background-color: rgb(143, 141, 141);
    color: whitesmoke;
}

.nines {
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