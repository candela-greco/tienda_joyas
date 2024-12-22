import express from "express";
import { joyasModel } from "./models/joyas.model.js";
import "dotenv/config";

const apiUrl = process.env.API_URL;
const PORT = process.env.PORT || 1000;
const app = express();
app.use(express.json());

const reportarConsulta = async (req, res, next) => {
    const { precio_max, precio_min, categoria, metal } = req.query;
    const url = req.url;
    console.log(`
    Hoy ${new Date()}
    Se ha recibido una consulta en la ruta ${url}
    con los parámetros:
    `, { precio_max, precio_min, categoria, metal });
    next();
}

app.get ('/joyas', reportarConsulta, async (req, res) => {
    const { limit = 2, order = "ASC", page = 1 } = req.query;
    const isPageValid = /^[1-9]\d*$/.test(page);

    if (!isPageValid) {
        return res.status(400).json({ message: "Numero de pagina invalido, number > 0" });
    }
    try {
        const inventario = await joyasModel.obtenerInventario({ limit, order, page });
        const HATEOAS = await joyasModel.consultaHATEOAS(inventario.results);
        res.json(HATEOAS)
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: "Error interno de servidor"});
    }
});

app.get('/joyas/filtros', reportarConsulta, async (req, res) => {
    const { precio_max, precio_min, categoria, metal } = req.query;

    try {
        const joyas = await joyasModel.joyasPorFiltros({ precio_max, precio_min, categoria, metal });

        if (joyas.length === 0) {
            return res.status(404).json({ message: "No se encontraron joyas con los filtros proporcionados" });
        }

        res.json(joyas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
});


app.listen ( PORT, () => {
    console.log(`Servidor corriendo en puerto http://localhost:${PORT}`);
});