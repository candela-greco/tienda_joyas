import { pool } from "../database/conection.js";
import format from 'pg-format';

const BASE_URL =
process.env.NODE_ENV === "production"
? process.env.joyas
: `http://localhost::${process.env.PORT}`;

const obtenerInventario = async ({ limit = 2, order = "ASC", page = 1 }) => {
    const countQuery = "SELECT COUNT(*) FROM inventario";
    const { rows: countResult } = await pool.query(countQuery);
    const total_rows = parseInt(countResult[0].count, 10);
    const total_pages = Math.ceil(total_rows / limit);

    const query = "SELECT * FROM inventario ORDER BY precio %s LIMIT %s OFFSET %s";
    const offset = ( page - 1 ) * limit;
    const formattedQuery = format (query, order, limit, offset);
    const { rows } = await pool.query(formattedQuery);

    const results = rows.map((row) => {
    return {
        ...row,
        href:`${BASE_URL}/joyas/${row.id}`,
        };
    });

    return {
        results,
        total_pages,
        page,
        limit,
        next:
            total_pages <= page ? null : `${BASE_URL}/joyas?limit=${limit}&pages=${page - 1 }`,
        previous:
            page <= 1 ? null : `${BASE_URL}/joyas?limit=${limit}&pages=${page - 1}`,
    };
};

const consultaHATEOAS = (inventario) => {
    if (!Array.isArray(inventario)) {
        throw new Error("El inventario no es un arreglo");
    }

    const results = inventario.map((i) => {
        return {
            name: i.nombre,
            href: `/joyas/inventario/${i.id}`,
        }
    }).slice(0, 6)
    const total = inventario.length;
    const HATEOAS = {
        total,
        results
    }
    return HATEOAS
};

const joyasPorFiltros = async ({ precio_max, precio_min, categoria, metal }) => {
    let filtros = [];
    const values = [];

    const agregarFiltro = (campo, comparador, valor) => {
        values.push(valor);
        const { length } = filtros;
        filtros.push(`${campo} ${comparador} $${length + 1}`);
    };

    if (precio_max) agregarFiltro('precio', '<=', precio_max);
    if (precio_min) agregarFiltro('precio', '>=', precio_min);
    if (categoria) agregarFiltro('categoria', '=', categoria);
    if (metal) agregarFiltro('metal', '=', metal);

    let consulta = "SELECT * FROM inventario";
    if (filtros.length > 0) {
        consulta += ` WHERE ${filtros.join(" AND ")}`;
    }

    const { rows: inventario } = await pool.query(consulta, values);
    return inventario;
};


export const joyasModel = {
    obtenerInventario,
    consultaHATEOAS,
    joyasPorFiltros,
};