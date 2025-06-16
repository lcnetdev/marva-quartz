export default class Component{
    constructor(cObj){
        this._label = cObj.label,
        this._uri = cObj.uri || null
        this._id = 0
        this._type = cObj.extra && cObj.extra.rdftypes ? cObj.extra.rdftypes[0] : "Topic"
        this._complex = false
        this._literal = true
        this._posStart = 0
        this._posEnd = 0 + this._label.length
        this._marcKey = cObj.extra && cObj.extra.marcKeys ? cObj.extra.marcKeys[0] : null
        this._nonLatinLabel = cObj.extra && cObj.extra.marcKeys ? cObj.extra.nonlatinLabels : []
        this._nonLatinMarcKey = cObj.extra && cObj.extra.marcKeys ? cObj.extra.marcKeys[0] : null  //TODO: is this right?
        this._complex = false
    }

    // Setters
    set label(x){
        this._label = x
    }
    set uri(x){
        this._uri = x
    }
    set id(x){
        this._id = x
    }
    set type(x){
        this._type = x
    }
    set complex(x){
        this._complex = x
    }
    set literal(x){
        this._literal = x
    }
    set posStart(x){
        this._posStart = x
    }
    set posEnd(x){
        this._posEnd = x
    }
    set marcKey(x){
        this._marcKey = x
    }
    set nonLatinLabel(x){
        this._nonLatinLabel = x
    }
    set nonLatinMarcKey(x){
        this._nonLatinMarcKey = x
    }

    // Getters
    get label(){
        return this._label
    }
    get uri(){
        return this._uri
    }
    get id(){
        return this._id
    }
    get type(){
        return this._type
    }
    get complex(){
        return this._complex
    }
    get literal(){
        return this._literal
    }
    get posStart(){
        return this._posStart
    }
    get posEnd(){
        return this._posEnd
    }
    get marcKey(){
        return this._marcKey
    }
    get nonLatinLabel(){
        return this._nonLatinLabel
    }
    get nonLatinMarcKey(){
        return this._nonLatinMarcKey
    }
}

