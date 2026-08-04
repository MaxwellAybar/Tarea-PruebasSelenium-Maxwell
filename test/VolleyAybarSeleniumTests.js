const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

describe('Checklist de Pruebas Automatizadas - VolleyAybar', function () {
    this.timeout(360000);
    let navegador;

    const rutaCapturas = path.join(__dirname, '../capturas');

    const esperar = async (milisegundos = 2200) => {
        await navegador.sleep(milisegundos);
    };

    before(async function () {
        if (!fs.existsSync(rutaCapturas)) {
            fs.mkdirSync(rutaCapturas, { recursive: true });
        }

        let opcionesConfig = new chrome.Options();
        opcionesConfig.addArguments('--disable-extensions');
        opcionesConfig.addArguments('--disable-popup-blocking');
        opcionesConfig.addArguments('--log-level=3');
        opcionesConfig.setChromeBinaryPath('C:\\Program Files\\Avast Software\\Browser\\Application\\AvastBrowser.exe');

        navegador = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(opcionesConfig)
            .build();

        await navegador.manage().window().maximize();
    });

    after(async function () {
        if (navegador) {
            try {
                await navegador.quit();
            } catch (e) {}
        }
        setTimeout(() => process.exit(0), 1000);
    });

    async function capturarPantallaEvidencia(identificadorPrueba) {
        try {
            const imagenData = await navegador.takeScreenshot();
            const archivoDestino = path.join(rutaCapturas, `${identificadorPrueba}.png`);
            fs.writeFileSync(archivoDestino, imagenData, 'base64');
        } catch (error) {}
    }

    async function configurarTextoAyudaContrasena() {
        try {
            const campoClave = await navegador.findElement(By.id('auth-pass'));
            await navegador.executeScript("arguments[0].setAttribute('placeholder', '123456')", campoClave);
        } catch (e) {}
    }

    async function hacerClicSeguro(elementoObjetivo) {
        await navegador.executeScript("arguments[0].scrollIntoView({block: 'center'});", elementoObjetivo);
        await esperar(800);
        try {
            await elementoObjetivo.click();
        } catch (e) {
            await navegador.executeScript("arguments[0].click();", elementoObjetivo);
        }
    }

    async function recargarEntornoPrueba() {
        const archivoLocal = 'file:///' + path.resolve(__dirname, '../web/index.html').replace(/\\/g, '/');
        await navegador.get(archivoLocal);
        await configurarTextoAyudaContrasena();
        await esperar(1500);
    }

    async function iniciarSesionComoEntrenador() {
        await recargarEntornoPrueba();
        await navegador.findElement(By.id('auth-email')).sendKeys('entrenador@voley.com');
        await esperar(1500);
        await navegador.findElement(By.id('auth-pass')).sendKeys('123456');
        await esperar(1500);
        await navegador.findElement(By.id('btn-submit-auth')).click();
        await navegador.wait(until.elementLocated(By.id('main-panel')), 10000);
        await esperar(2000);
    }

    async function registrarAtletaPrueba() {
        const registrosBase = [
            { nombre: 'Pedro Gomez', num: '5' },
            { nombre: 'Marcos Ruiz', num: '12' },
            { nombre: 'Juan Perez', num: '9' },
            { nombre: 'Ana Martínez', num: '7' }
        ];

        for (let atleta of registrosBase) {
            await navegador.findElement(By.id('player-name')).sendKeys(atleta.nombre);
            await esperar(800);
            await navegador.findElement(By.id('player-number')).sendKeys(atleta.num);
            await esperar(800);
            await navegador.findElement(By.id('btn-save')).click();
            await esperar(1200);
        }
        await esperar(2000);
    }

// USER STORIES DEL 01 AL 05

    describe('US-1: Login - Autenticación de Entrenador', function () {
        beforeEach(async function () {
            await recargarEntornoPrueba();
        });

        it('Camino Feliz: Iniciar sesión con credenciales correctas', async function () {
            await navegador.findElement(By.id('auth-email')).sendKeys('entrenador@voley.com');
            await esperar(1500);
            await navegador.findElement(By.id('auth-pass')).sendKeys('123456');
            await esperar(1500);
            await navegador.findElement(By.id('btn-submit-auth')).click();

            const panelDashboard = await navegador.wait(until.elementLocated(By.id('main-panel')), 10000);
            await esperar(2500);
            assert.strictEqual(await panelDashboard.isDisplayed(), true);
            await capturarPantallaEvidencia('US1_Camino_Feliz');
        });

        it('Prueba Negativa: Iniciar sesión con credenciales incorrectas', async function () {
            await navegador.findElement(By.id('auth-email')).sendKeys('error@voley.com');
            await esperar(1500);
            await navegador.findElement(By.id('auth-pass')).sendKeys('000000');
            await esperar(1500);
            await navegador.findElement(By.id('btn-submit-auth')).click();

            const avisoError = await navegador.wait(until.elementLocated(By.id('auth-alert')), 10000);
            await esperar(2500);
            assert.strictEqual((await avisoError.getText()).trim(), 'Credenciales incorrectas');
            await capturarPantallaEvidencia('US1_Prueba_Negativa');
        });

        it('Prueba de Límites: Intentar login con campos vacíos', async function () {
            await esperar(1500);
            await navegador.findElement(By.id('btn-submit-auth')).click();

            const avisoError = await navegador.wait(until.elementLocated(By.id('auth-alert')), 10000);
            await esperar(2500);
            assert.strictEqual((await avisoError.getText()).trim(), 'Campos obligatorios vacíos');
            await capturarPantallaEvidencia('US1_Prueba_Limites');
        });
    });

    describe('US-2: Create - Registro de Nuevo Atleta', function () {
        beforeEach(async function () {
            await iniciarSesionComoEntrenador();
        });

        it('Camino Feliz: Registrar jugador válido', async function () {
            await navegador.findElement(By.id('player-name')).sendKeys('Carlos Gómez');
            await esperar(1500);
            await navegador.findElement(By.id('player-number')).sendKeys('10');
            await esperar(1500);
            await navegador.findElement(By.id('btn-save')).click();

            const columnaNombre = await navegador.wait(until.elementLocated(By.className('col-name')), 10000);
            await esperar(2500);
            assert.strictEqual((await columnaNombre.getText()).trim(), 'Carlos Gómez');
            await capturarPantallaEvidencia('US2_Camino_Feliz');
        });

        it('Prueba Negativa: Intentar guardar sin datos', async function () {
            await navegador.findElement(By.id('btn-save')).click();

            const avisoError = await navegador.wait(until.elementLocated(By.id('panel-alert')), 10000);
            await navegador.wait(until.elementTextIs(avisoError, 'Datos incompletos'), 10000);
            await esperar(2500);
            assert.strictEqual((await avisoError.getText()).trim(), 'Datos incompletos');
            await capturarPantallaEvidencia('US2_Prueba_Negativa');
        });

        it('Prueba de Límites: Número de camiseta fuera de rango', async function () {
            await navegador.findElement(By.id('player-name')).sendKeys('Jugador Limite');
            await esperar(1500);
            await navegador.findElement(By.id('player-number')).sendKeys('150');
            await esperar(1500);
            await navegador.findElement(By.id('btn-save')).click();

            const avisoError = await navegador.wait(until.elementLocated(By.id('panel-alert')), 10000);
            await navegador.wait(until.elementTextIs(avisoError, 'Número fuera de rango de límite'), 10000);
            await esperar(2500);
            assert.strictEqual((await avisoError.getText()).trim(), 'Número fuera de rango de límite');
            await capturarPantallaEvidencia('US2_Prueba_Limites');
        });
    });

    describe('US-3: Read - Consulta y Búsqueda de Atletas', function () {
        beforeEach(async function () {
            await iniciarSesionComoEntrenador();
        });

        it('Camino Feliz: Buscar jugador existente', async function () {
            await registrarAtletaPrueba();

            const campoBusqueda = await navegador.findElement(By.id('search-input'));
            await campoBusqueda.sendKeys('Ana');
            await esperar(2500);

            const registrosFila = await navegador.findElements(By.className('player-row'));
            let nombreEncontrado = '';
            for (let fila of registrosFila) {
                if (await fila.isDisplayed()) {
                    const celdaNombre = await fila.findElement(By.className('col-name'));
                    nombreEncontrado = (await celdaNombre.getText()).trim();
                    break;
                }
            }

            assert.strictEqual(nombreEncontrado, 'Ana Martínez');
            await capturarPantallaEvidencia('US3_Camino_Feliz');
        });

        it('Prueba Negativa: Buscar término inexistente', async function () {
            await registrarAtletaPrueba();

            const campoBusqueda = await navegador.findElement(By.id('search-input'));
            await campoBusqueda.clear();
            await campoBusqueda.sendKeys('XXXXX');
            await navegador.executeScript("arguments[0].dispatchEvent(new Event('keyup'));", campoBusqueda);
            await esperar(2500);

            const registrosFila = await navegador.findElements(By.className('player-row'));
            let contadorVisibles = 0;
            for (let fila of registrosFila) {
                if (await fila.isDisplayed()) contadorVisibles++;
            }

            assert.strictEqual(contadorVisibles, 0);
            await capturarPantallaEvidencia('US3_Prueba_Negativa');
        });

        it('Prueba de Límites: Buscar con caracteres especiales', async function () {
            await registrarAtletaPrueba();

            const campoBusqueda = await navegador.findElement(By.id('search-input'));
            await campoBusqueda.clear();
            await campoBusqueda.sendKeys('@#$%^&*()_+');
            await navegador.executeScript("arguments[0].dispatchEvent(new Event('keyup'));", campoBusqueda);
            await esperar(2500);

            const registrosFila = await navegador.findElements(By.className('player-row'));
            let contadorVisibles = 0;
            for (let fila of registrosFila) {
                if (await fila.isDisplayed()) contadorVisibles++;
            }

            assert.strictEqual(contadorVisibles, 0);
            await capturarPantallaEvidencia('US3_Prueba_Limites');
        });
    });

    describe('US-4: Update - Modificación de Atleta Existente', function () {
        beforeEach(async function () {
            await iniciarSesionComoEntrenador();
        });

        it('Camino Feliz: Actualizar datos de jugador', async function () {
            await navegador.findElement(By.id('player-name')).sendKeys('Pedro Lopez');
            await esperar(1500);
            await navegador.findElement(By.id('player-number')).sendKeys('5');
            await esperar(1500);
            await navegador.findElement(By.id('btn-save')).click();

            const botonEditar = await navegador.wait(until.elementLocated(By.className('btn-edit')), 10000);
            await navegador.wait(until.elementIsVisible(botonEditar), 10000);
            await esperar(1500);

            await hacerClicSeguro(botonEditar);
            await esperar(2000);

            const inputNombre = await navegador.findElement(By.id('player-name'));
            await inputNombre.clear();
            await inputNombre.sendKeys('Pedro Lopez Editado');
            await esperar(1500);
            await navegador.findElement(By.id('btn-save')).click();
            await esperar(2500);

            const textoActualizado = await navegador.findElement(By.className('col-name')).getText();
            assert.strictEqual(textoActualizado.trim(), 'Pedro Lopez Editado');
            await capturarPantallaEvidencia('US4_Camino_Feliz');
        });

        it('Prueba Negativa: Intentar guardar edición borrando campo obligatorio', async function () {
            await navegador.findElement(By.id('player-name')).sendKeys('Pedro Lopez');
            await esperar(1500);
            await navegador.findElement(By.id('player-number')).sendKeys('5');
            await esperar(1500);
            await navegador.findElement(By.id('btn-save')).click();

            const botonEditar = await navegador.wait(until.elementLocated(By.className('btn-edit')), 10000);
            await navegador.wait(until.elementIsVisible(botonEditar), 10000);
            await esperar(1500);

            await hacerClicSeguro(botonEditar);
            await esperar(2000);

            const inputNombre = await navegador.findElement(By.id('player-name'));
            await inputNombre.clear();
            await esperar(1500);
            await navegador.findElement(By.id('btn-save')).click();

            const avisoError = await navegador.wait(until.elementLocated(By.id('panel-alert')), 10000);
            await navegador.wait(until.elementTextIs(avisoError, 'Datos incompletos'), 10000);
            await esperar(2500);
            assert.strictEqual((await avisoError.getText()).trim(), 'Datos incompletos');
            await capturarPantallaEvidencia('US4_Prueba_Negativa');
        });

        it('Prueba de Límites: Editar con un nombre de longitud máxima', async function () {
            await navegador.findElement(By.id('player-name')).sendKeys('Pedro Lopez');
            await esperar(1500);
            await navegador.findElement(By.id('player-number')).sendKeys('5');
            await esperar(1500);
            await navegador.findElement(By.id('btn-save')).click();

            const botonEditar = await navegador.wait(until.elementLocated(By.className('btn-edit')), 10000);
            await navegador.wait(until.elementIsVisible(botonEditar), 10000);
            await esperar(1500);

            await hacerClicSeguro(botonEditar);
            await esperar(2000);

            const cadenaExtensa = 'Alexander De La Cruz Morales';
            const inputNombre = await navegador.findElement(By.id('player-name'));
            await inputNombre.clear();
            await inputNombre.sendKeys(cadenaExtensa);
            await esperar(1500);
            await navegador.findElement(By.id('btn-save')).click();
            await esperar(2500);

            const textoActualizado = await navegador.findElement(By.className('col-name')).getText();
            assert.strictEqual(textoActualizado.trim(), cadenaExtensa);
            await capturarPantallaEvidencia('US4_Prueba_Limites');
        });
    });

    describe('US-5: Delete - Eliminación de Atleta', function () {
        beforeEach(async function () {
            await iniciarSesionComoEntrenador();
        });

        it('Camino Feliz: Eliminar un jugador de la lista', async function () {
            await navegador.findElement(By.id('player-name')).sendKeys('Jugador A Borrar');
            await esperar(1500);
            await navegador.findElement(By.id('player-number')).sendKeys('9');
            await esperar(1500);
            await navegador.findElement(By.id('btn-save')).click();

            const botonEliminar = await navegador.wait(until.elementLocated(By.className('btn-danger')), 10000);
            await navegador.wait(until.elementIsVisible(botonEliminar), 10000);
            await esperar(1500);

            await hacerClicSeguro(botonEliminar);
            await navegador.wait(until.alertIsPresent(), 15000);
            await esperar(2000);

            await navegador.switchTo().alert().accept();
            await esperar(2000);

            const registrosFila = await navegador.findElements(By.className('player-row'));
            assert.strictEqual(registrosFila.length, 0);
            await capturarPantallaEvidencia('US5_Camino_Feliz');

            await navegador.executeScript("localStorage.clear();");
            await recargarEntornoPrueba();
            await esperar(2000);
        });

        it('Prueba Negativa: Cancelar la alerta de eliminación', async function () {
            await navegador.findElement(By.id('player-name')).sendKeys('Jugador No Borrar');
            await esperar(1500);
            await navegador.findElement(By.id('player-number')).sendKeys('9');
            await esperar(1500);
            await navegador.findElement(By.id('btn-save')).click();

            const botonEliminar = await navegador.wait(until.elementLocated(By.className('btn-danger')), 10000);
            await navegador.wait(until.elementIsVisible(botonEliminar), 10000);
            await esperar(1500);

            await hacerClicSeguro(botonEliminar);
            await navegador.wait(until.alertIsPresent(), 15000);
            await esperar(2000);

            await navegador.switchTo().alert().dismiss();
            await esperar(2000);

            const registrosFila = await navegador.findElements(By.className('player-row'));
            assert.strictEqual(registrosFila.length, 1);
            await capturarPantallaEvidencia('US5_Prueba_Negativa');

            await navegador.executeScript("localStorage.clear();");
            await recargarEntornoPrueba();
            await esperar(2000);
        });

        it('Prueba de Límites: Eliminar múltiples atletas de forma sucesiva hasta vaciar la lista', async function () {
            await registrarAtletaPrueba();

            const botonesEliminar = await navegador.findElements(By.className('btn-danger'));
            
            for (let i = 0; i < botonesEliminar.length; i++) {
                const btnActual = await navegador.findElement(By.className('btn-danger'));
                await hacerClicSeguro(btnActual);
                
                await navegador.wait(until.alertIsPresent(), 15000);
                await esperar(1000);
                await navegador.switchTo().alert().accept();
                await esperar(1500);
            }

            const registrosFila = await navegador.findElements(By.className('player-row'));
            let contadorVisibles = 0;
            for (let fila of registrosFila) {
                if (await fila.isDisplayed()) contadorVisibles++;
            }

            assert.strictEqual(contadorVisibles, 0);
            await capturarPantallaEvidencia('US5_Prueba_Limites');

            await navegador.executeScript("localStorage.clear();");
            await recargarEntornoPrueba();
            await esperar(2000);
        });
    });
});