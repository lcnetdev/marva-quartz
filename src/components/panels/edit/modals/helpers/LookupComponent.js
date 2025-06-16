export default class Component{
    constructor(label){
        this._label = label,
        this._uri = null,
        this._id = 0,
        this._type = null,
        this._complex = false,
        this._literal = true,
        this._posStart = 0,
        this._posEnd = 0 + label.length,
        this._marcKey = null,
        this._nonLatinLabel = null,
        this._nonLatinMarcKey = null
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

