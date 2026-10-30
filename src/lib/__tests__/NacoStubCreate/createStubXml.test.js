import { describe, expect, test } from 'vitest'
import utils_export from "@/lib/utils_export";
import { createPinia } from 'pinia'
import { createApp } from 'vue'

const pinia = createPinia()
const app = createApp()
app.use(pinia)




describe('Build a stub', () => {
    test('Built XML is correct', () => {
        const oneXXParts = {"a":"test name","fieldTag":"100","indicators":"0 ", "d":"1900-2000"}
        const fourXXParts = {"a":"name test","fieldTag":"400","indicators":"0 "}
        const mainTitle = "Test title"
        const lccn=  2025700486
        const instanceUri = "http://id.loc.gov/resources/instances/123"
        const mainTitleDate = "2026"
        const mainTitleLccn = "Test LCCN"
        const mainTitleNote = "title page (SOR)"
        const zero46 = null
        const add667 = false
        const extraMarcStatements = [{"1":["f","1900"],"2":["g","2000"],"3":["2","edtf"],"fieldTag":"046","indicators":"  "}, {"1":["a","Test title, 2026:"],"2":["b","title page (SOR)"],"3":["u","http://id.loc.gov/resources/instances/in01260000051"],"fieldTag":"670","indicators":"  "},{"1":["a","another name"],"fieldTag":"400","indicators":"  "},{"1":["w","r"],"2":["i","Container of (work):"],"3":["a","Bova, Ben,"],"4":["d","1932-2020."],"5":["t","Long way back"],"fieldTag":"500","indicators":"1 "}]

        const { xml, text } = utils_export.createNacoStubXML(oneXXParts, fourXXParts, mainTitle, lccn, instanceUri, mainTitleDate, mainTitleLccn, mainTitleNote, null, add667, extraMarcStatements, false)


        expect(xml).toContain('<marcxml:datafield tag="010" ind1=" " ind2=" "><marcxml:subfield code="a">n 2025700486</marcxml:subfield></marcxml:datafield>')
        expect(xml).toContain('<marcxml:datafield tag="040" ind1=" " ind2=" "><marcxml:subfield code="a">DLC</marcxml:subfield><marcxml:subfield code="b">eng</marcxml:subfield><marcxml:subfield code="c">DLC</marcxml:subfield><marcxml:subfield code="e">rda</marcxml:subfield></marcxml:datafield>')
        expect(xml).toContain('<marcxml:datafield tag="046" ind1=" " ind2=" "><marcxml:subfield code="f">1900</marcxml:subfield><marcxml:subfield code="g">2000</marcxml:subfield><marcxml:subfield code="2">edtf</marcxml:subfield></marcxml:datafield>')


        expect(xml).toContain('<marcxml:datafield tag="100" ind1="0" ind2=" "><marcxml:subfield code="a">test name</marcxml:subfield><marcxml:subfield code="d">1900-2000</marcxml:subfield></marcxml:datafield>')
        expect(xml).toContain('<marcxml:datafield tag="400" ind1="0" ind2=" "><marcxml:subfield code="a">name test</marcxml:subfield></marcxml:datafield>')
        expect(xml).toContain('<marcxml:datafield tag="400" ind1=" " ind2=" "><marcxml:subfield code="a">another name</marcxml:subfield></marcxml:datafield>')

        expect(xml).toContain('<marcxml:datafield tag="500" ind1="1" ind2=" "><marcxml:subfield code="w">r</marcxml:subfield><marcxml:subfield code="i">Container of (work):</marcxml:subfield><marcxml:subfield code="a">Bova, Ben,</marcxml:subfield><marcxml:subfield code="d">1932-2020.</marcxml:subfield><marcxml:subfield code="t">Long way back</marcxml:subfield></marcxml:datafield>')
        expect(xml).toContain('<marcxml:datafield tag="670" ind1=" " ind2=" "><marcxml:subfield code="a">Test title, 2026:</marcxml:subfield><marcxml:subfield code="b">title page (SOR)</marcxml:subfield><marcxml:subfield code="u">http://id.loc.gov/resources/instances/in01260000051</marcxml:subfield></marcxml:datafield>')

        expect(xml).toContain('<marcxml:datafield tag="985" ind1=" " ind2=" "><marcxml:subfield code="e">MARVA-NAR</marcxml:subfield><marcxml:subfield code="d">2026-10-30</marcxml:subfield></marcxml:datafield>')
    })
})
