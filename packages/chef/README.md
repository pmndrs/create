# 👨‍🍳 @pmndrs/chef

*Chef takes recipes and cooks your projects.*

### How does a `recipe.json` look like ?

```json
{
    "name": "sample-recipe",
    "version": "0.0.0",
    //recipe dependencies
    "dependencies": {
        "other-recipe": "^0.2.0"
    },
    //modify the project variables and files
    "edits": {
        //write file and define variable
        "index.js": "console.log(...{{ @messages }})",
        //write variable
        "@messages": ["'Hello'", "'Wo' + 'rld'"],
        //modify and push a number to an array
        "@other-array": {
            "push": 123 //same as "123"
        },
        //modify file
        "package.json/dependencies/vite": "latest",
    }
}
```

*Notice*
- folders are not allowed to contain `.` in their name
- files are not allowed to start with `@`
- strings in edits are always seen as raw values e.g. `{ "test": "123" }` will end up in the finap project as `{ "test": 123 }`. To achieve `{ "test": "123" }` in the project, additional quotes are necassary: `{ "test": "'123'" }`
- using the string edit `'{ "test": "123" }'` is the same as using the json edit `{ "test": "'123'" }`