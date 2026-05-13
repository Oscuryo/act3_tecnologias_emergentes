const btnUbicacion = document.getElementById("btnUbicacion");
const btnCCAA = document.getElementById("btnCCAA");
const btnMaritimos = document.getElementById("btnMaritimos");
const btnHistorico = document.getElementById("btnHistorico");

const estado = document.getElementById("estado");
const resultado = document.getElementById("resultado");

const selectorCarburante = document.getElementById("carburante");
const selectorCCAA = document.getElementById("ccaa");
const selectorProvinciaMaritima = document.getElementById("provinciaMaritima");
const selectorProvinciaHistorico = document.getElementById("provinciaHistorico");
const selectorProductoHistorico = document.getElementById("productoHistorico");
const selectorFechaHistorico = document.getElementById("fechaHistorico");

const tabs = document.querySelectorAll(".tab");
const vistas = document.querySelectorAll(".vista");

btnUbicacion.addEventListener("click", obtenerUbicacion);
btnCCAA.addEventListener("click", buscarPorCCAA);
btnMaritimos.addEventListener("click", buscarPostesMaritimos);
btnHistorico.addEventListener("click", buscarHistorico);

let latitudUsuario = 0;
let longitudUsuario = 0;

inicializarFecha();

tabs.forEach(tab => {

    tab.addEventListener("click", () => {

        const vista = tab.dataset.vista;

        tabs.forEach(t => t.classList.remove("activo"));
        vistas.forEach(v => v.classList.remove("activa"));

        tab.classList.add("activo");
        document.getElementById("vista-" + vista).classList.add("activa");

        estado.innerHTML = "";
        resultado.innerHTML = "";

    });

});

function inicializarFecha(){

    const hoy = new Date();

    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, "0");
    const dd = String(hoy.getDate()).padStart(2, "0");

    selectorFechaHistorico.value = `${yyyy}-${mm}-${dd}`;
}

function obtenerUbicacion(){

    estado.innerHTML = "Obteniendo ubicación...";
    resultado.innerHTML = "";

    if(navigator.geolocation){

        navigator.geolocation.getCurrentPosition(
            function(posicion){

                latitudUsuario = posicion.coords.latitude;
                longitudUsuario = posicion.coords.longitude;

                estado.innerHTML =
                    "Ubicación obtenida correctamente. Consultando API...";

                consultarAPIPrincipal();

            },
            mostrarError
        );

    }else{

        estado.innerHTML =
            "La geolocalización no está disponible.";

    }
}

function mostrarError(error){

    estado.innerHTML =
        "No se pudo obtener la ubicación.";

    console.log(error);
}

function consultarAPIPrincipal(){

    const url =
    "https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/";

    fetch(url)

        .then(respuesta => respuesta.json())

        .then(datos => {

            const gasolineras =
                datos.ListaEESSPrecio;

            const fechaActualizacion =
                datos.Fecha;

            estado.innerHTML =
                "Datos recibidos correctamente. Mostrando gasolineras cercanas. Última actualización API: " +
                fechaActualizacion;

            mostrarGasolinerasCercanas(gasolineras);

        })

        .catch(error => {

            estado.innerHTML =
                "Error al consultar la API.";

            console.log(error);

        });
}

function mostrarGasolinerasCercanas(gasolineras){

    resultado.innerHTML = "";

    const tipoCarburante =
        selectorCarburante.value;

    const nombreCarburante =
        selectorCarburante.options[
            selectorCarburante.selectedIndex
        ].text;

    let gasolinerasConPrecio = [];

    gasolineras.forEach(gasolinera => {

        const precio =
            gasolinera[tipoCarburante];

        if(precio && precio.trim() !== ""){

            const latitudGasolinera =
                parseFloat(
                    gasolinera["Latitud"]
                    .replace(",", ".")
                );

            const longitudGasolinera =
                parseFloat(
                    gasolinera["Longitud (WGS84)"]
                    .replace(",", ".")
                );

            const distancia =
                calcularDistancia(
                    latitudUsuario,
                    longitudUsuario,
                    latitudGasolinera,
                    longitudGasolinera
                );

            gasolinera.distancia = distancia;
            gasolinera.precioSeleccionado = precio;

            gasolinerasConPrecio.push(gasolinera);
        }

    });

    gasolinerasConPrecio.sort(
        (a,b) => a.distancia - b.distancia
    );

    resultado.innerHTML = `
        <div class="cabecera-resultados">
            <i class="fa-solid fa-location-dot"></i>
            Mostrando las 10 gasolineras más cercanas con ${nombreCarburante}
        </div>
    `;

    pintarGasolineras(gasolinerasConPrecio.slice(0,10), nombreCarburante, true);
}

function buscarPorCCAA(){

    estado.innerHTML =
        "Consultando estaciones de servicio por comunidad autónoma...";

    resultado.innerHTML = "";

    const idCCAA =
        selectorCCAA.value;

    const nombreCCAA =
        selectorCCAA.options[
            selectorCCAA.selectedIndex
        ].text;

    const url =
    "https://energia.serviciosmin.gob.es/ServiciosRestCarburantes/PreciosCarburantes/EstacionesTerrestres/FiltroCCAA/" + idCCAA;

    fetch(url)

        .then(respuesta => respuesta.json())

        .then(datos => {

            const estaciones =
                datos.ListaEESSPrecio || [];

            estado.innerHTML =
                "Datos recibidos correctamente. Comunidad autónoma seleccionada: " +
                nombreCCAA;

            resultado.innerHTML = `
                <div class="cabecera-resultados">
                    <i class="fa-solid fa-map"></i>
                    Estaciones de servicio en ${nombreCCAA}
                </div>
            `;

            pintarGasolineras(estaciones.slice(0,50), "Gasolina 95 E5", false);

        })

        .catch(error => {

            estado.innerHTML =
                "Error al consultar estaciones por comunidad autónoma.";

            console.log(error);

        });
}

function buscarPostesMaritimos(){

    estado.innerHTML =
        "Consultando postes marítimos por provincia...";

    resultado.innerHTML = "";

    const idProvincia =
        selectorProvinciaMaritima.value;

    const nombreProvincia =
        selectorProvinciaMaritima.options[
            selectorProvinciaMaritima.selectedIndex
        ].text;

    const url =
    "https://energia.serviciosmin.gob.es/ServiciosRestCarburantes/PreciosCarburantes/PostesMaritimos/FiltroProvincia/" + idProvincia;

    fetch(url)

        .then(respuesta => respuesta.json())

        .then(datos => {

            const postes =
                datos.ListaEESSPrecio || [];

            estado.innerHTML =
                "Datos recibidos correctamente. Provincia seleccionada: " +
                nombreProvincia;

            resultado.innerHTML = `
                <div class="cabecera-resultados">
                    <i class="fa-solid fa-anchor"></i>
                    Postes marítimos en ${nombreProvincia}
                </div>
            `;

            if(postes.length === 0){

                resultado.innerHTML += `
                    <div class="tarjeta">
                        <h2>No hay resultados</h2>
                        <p>No se han encontrado postes marítimos para la provincia seleccionada.</p>
                    </div>
                `;

                return;
            }

            pintarGasolineras(postes.slice(0,50), "Gasóleo marítimo", false);

        })

        .catch(error => {

            estado.innerHTML =
                "Error al consultar postes marítimos.";

            console.log(error);

        });
}

function buscarHistorico(){

    estado.innerHTML =
        "Consultando precios por provincia, producto y día...";

    resultado.innerHTML = "";

    const provincia =
        selectorProvinciaHistorico.value;

    const nombreProvincia =
        selectorProvinciaHistorico.options[
            selectorProvinciaHistorico.selectedIndex
        ].text;

    const producto =
        selectorProductoHistorico.value;

    const nombreProducto =
        selectorProductoHistorico.options[
            selectorProductoHistorico.selectedIndex
        ].text;

    const fecha =
        convertirFecha(selectorFechaHistorico.value);

    if(!fecha){

        estado.innerHTML =
            "Selecciona una fecha válida.";

        return;
    }

    const url =
    "https://energia.serviciosmin.gob.es/ServiciosRestCarburantes/PreciosCarburantes/EstacionesTerrestresHist/FiltroProvinciaProducto/" +
    fecha + "/" + provincia + "/" + producto;

    fetch(url)

        .then(respuesta => respuesta.json())

        .then(datos => {

            const estaciones =
                datos.ListaEESSPrecio || [];

            estaciones.forEach(estacion => {

                estacion.precioSeleccionado =
                    obtenerPrecioHistorico(estacion);

            });

            estado.innerHTML =
                "Datos recibidos correctamente. Provincia: " +
                nombreProvincia +
                ". Producto: " +
                nombreProducto +
                ". Día: " +
                fecha;

            resultado.innerHTML = `
                <div class="cabecera-resultados">
                    <i class="fa-solid fa-calendar-days"></i>
                    Precios de ${nombreProducto} en ${nombreProvincia} el ${fecha}
                </div>
            `;

            if(estaciones.length === 0){

                resultado.innerHTML += `
                    <div class="tarjeta">
                        <h2>No hay resultados</h2>
                        <p>No se han encontrado precios para los datos seleccionados.</p>
                    </div>
                `;

                return;
            }

            pintarGasolineras(estaciones.slice(0,50), nombreProducto, false);

        })

        .catch(error => {

            estado.innerHTML =
                "Error al consultar precios históricos.";

            console.log(error);

        });
}

function pintarGasolineras(lista, nombreCarburante, mostrarDistancia){

    lista.forEach(gasolinera => {

        const logo =
            obtenerLogo(gasolinera["Rótulo"] || "");

        const precio =
            gasolinera.precioSeleccionado ||
            gasolinera["Precio Gasolina 95 E5"] ||
            gasolinera["Precio Gasolina 98 E5"] ||
            gasolinera["Precio Gasoleo A"] ||
            gasolinera["Precio Gasoleo Premium"] ||
            "No disponible";

        const latitud =
            gasolinera["Latitud"]
            ? gasolinera["Latitud"].replace(",", ".")
            : "";

        const longitud =
            gasolinera["Longitud (WGS84)"]
            ? gasolinera["Longitud (WGS84)"].replace(",", ".")
            : "";

        const enlaceMaps =
            latitud && longitud
            ? `https://www.google.com/maps/search/?api=1&query=${latitud},${longitud}`
            : "#";

        resultado.innerHTML += `

            <div class="tarjeta">

                <div class="contenido-tarjeta">

                    ${
                        logo
                        ?
                        `<img
                            class="logo-gasolinera"
                            src="${logo}"
                            alt="Logo gasolinera">`
                        :
                        `<div class="logo-generico">
                            ⛽
                         </div>`
                    }

                    <div class="info-gasolinera">

                        <h2>${gasolinera["Rótulo"] || "Sin rótulo"}</h2>

                        <p>
                            <i class="fa-solid fa-location-dot"></i>
                            <strong>Dirección:</strong>
                            ${gasolinera["Dirección"] || "No disponible"}
                        </p>

                        <p>
                            <i class="fa-solid fa-city"></i>
                            <strong>Municipio:</strong>
                            ${gasolinera["Municipio"] || "No disponible"}
                        </p>

                        <p>
                            <i class="fa-solid fa-map"></i>
                            <strong>Provincia:</strong>
                            ${gasolinera["Provincia"] || "No disponible"}
                        </p>

                        <p class="precio">

                            <i class="fa-solid fa-gas-pump"></i>

                            <strong>
                                ${nombreCarburante}:
                            </strong>

                            ${precio} €

                        </p>

                        ${
                            mostrarDistancia
                            ?
                            `<p>
                                <i class="fa-solid fa-road"></i>
                                <strong>Distancia:</strong>
                                ${gasolinera.distancia.toFixed(2)} km
                            </p>`
                            :
                            ""
                        }

                        ${
                            latitud && longitud
                            ?
                            `<a class="maps"
                               href="${enlaceMaps}"
                               target="_blank">

                               <i class="fa-solid fa-map-location-dot"></i>

                               Ver en Google Maps

                            </a>`
                            :
                            ""
                        }

                    </div>

                </div>

            </div>

        `;
    });
}

function obtenerPrecioHistorico(estacion){

    const claves = Object.keys(estacion);

    for(let i = 0; i < claves.length; i++){

        const clave = claves[i];
        const valor = estacion[clave];

        if(
            clave.toLowerCase().includes("precio") &&
            valor &&
            valor.toString().trim() !== "" &&
            valor.toString().trim() !== "0"
        ){
            return valor;
        }
    }

    for(let i = 0; i < claves.length; i++){

        const valor = estacion[claves[i]];

        if(
            valor &&
            typeof valor === "string" &&
            /^[0-9]+,[0-9]{3}$/.test(valor.trim())
        ){
            return valor;
        }
    }

    return "No disponible";
}

function obtenerLogo(rotulo){

    const nombre = rotulo.toUpperCase();

    if(nombre.includes("REPSOL")){
        return "logos/repsol.png";
    }

    if(nombre.includes("CEPSA")){
        return "logos/cepsa.png";
    }

    if(nombre.includes("GALP")){
        return "logos/galp.png";
    }

    if(nombre.includes("BP")){
        return "logos/bp.png";
    }

    if(nombre.includes("PLENERGY")){
        return "logos/plenergy.png";
    }

    if(nombre.includes("BALLENOIL")){
        return "logos/Logo_Ballenoil.png";
    }

    if(nombre.includes("PETROPRIX")){
        return "logos/Logo_Petroprix.png";
    }

    if(nombre.includes("T9")){
        return "logos/t9.png";
    }

    if(nombre.includes("SHELL")){
        return "logos/shell.png";
    }

    if(nombre.includes("MOEVE")){
        return "logos/moeve.png";
    }

    return null;
}

function convertirFecha(fechaISO){

    if(!fechaISO){
        return null;
    }

    const partes =
        fechaISO.split("-");

    return partes[2] + "-" + partes[1] + "-" + partes[0];
}

function calcularDistancia(lat1, lon1, lat2, lon2){

    const R = 6371;

    const dLat =
        (lat2 - lat1) * Math.PI / 180;

    const dLon =
        (lon2 - lon1) * Math.PI / 180;

    const a =

        Math.sin(dLat/2) *
        Math.sin(dLat/2) +

        Math.cos(lat1 * Math.PI / 180) *

        Math.cos(lat2 * Math.PI / 180) *

        Math.sin(dLon/2) *

        Math.sin(dLon/2);

    const c =
        2 * Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1-a)
        );

    return R * c;
}