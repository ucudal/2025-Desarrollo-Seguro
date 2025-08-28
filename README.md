# Desarrollo Seguro
Repositorio de los fuentes del código de desarrollo seguro.

## Inicio desde 0
```
docker compose -f 'docker-compose.yaml' up -d --build 
```

### Carga inicial
#### TODO: Poner el seed en un contenedor 
```
cd .\services\backend\
npx knex seed:run --knexfile src/knexfile.ts
```

La base de datos se publica en el puerto `5432` con credenciales `user`:`password`



### TODO: Describir ambiente de desarrollo


react
    login
    ver mi perfil
    busqueda de historia clinica con xss
    descargar los estudios en un zip

backend
    login jwt
    ver perfil con un id dado
    cambio de password con un id dado sin pedir el password anterior (put)
    busqueda de historia clinica con sql en fecha desde 
    descargar los estudios de un zip con os injection
    ver como hacer una inyección de codigo ( un eval?)


C:\Users\user\SourceCode\desarrollo-seguro\services\backend> cd .\src\
    https://knexjs.org/guide/raw.html#raw-parameter-binding
    npx knex --knexfile src/knexfile.ts migrate:make create_users_table
    npx knex --knexfile src/knexfile.ts migrate:latest

    npx ts-node-dev src/index.ts



    /// Code Injection

    app.get('/update',function (req, res) {
  // Get the JSON object from "json" GET parameter
  var queryData = querystring.parse(url.parse(req.url).query);
  if(queryData.json){
    var jsonObj = eval('('+queryData.json+')');
    if(jsonObj.data) {
      // Do something with the parsed JSON object
    }
  }
});

// template injection mandando un mail a mailhog
https://dione.lib.unipi.gr/xmlui/bitstream/handle/unipi/12131/Parara_mte1630.pdf?sequence=4&isAllowed=y

// problemas de jwt

// problema de setpassword, que le falta el password actual

// olvide mi password, con algo corto que sale por fuerza bruta

// Armar una UI
