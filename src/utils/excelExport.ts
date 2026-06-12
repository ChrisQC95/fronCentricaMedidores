import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import type { RegistroMedidor } from '@/services/medidor.service'
import type { InfraestructuraResponse } from '@/services/infraestructura.service'

// ══════════════════════════════════════════════════════════════════════════════
// ── Interfaces del Pivot ──────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

export interface PivotCell {
  voltaje:     number | null
  consumo:     number | null
  observacion: string | null
}

export interface ArrendatarioRow {
  nombre:           string
  infraestructuraId: number
  byMonth:          Record<string, PivotCell>  // key: "YYYY-MM"
}

export interface PisoGroup {
  nombre:        string
  arrendatarios: ArrendatarioRow[]
}

export interface EdificioGroup {
  nombre: string
  pisos:  PisoGroup[]
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Helpers de jerarquía ──────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

interface Ancestors { edificio: string; piso: string; arrendatario: string }

/**
 * Recorre el árbol hacia arriba desde un nodo hasta encontrar
 * UNIDAD (edificio), PISO/BLOQUE, y ENST/ESPACIO_COMUN (arrendatario).
 */
function getAncestors(
  nodeId: number,
  nodeMap: Map<number, InfraestructuraResponse>,
): Ancestors {
  const chain: InfraestructuraResponse[] = []
  let current = nodeMap.get(nodeId)

  while (current) {
    chain.unshift(current)
    if (current.parentId == null) break
    current = nodeMap.get(current.parentId)
  }

  const unidad  = chain.find(n => n.tipo === 'UNIDAD')
  const piso    = chain.find(n => n.tipo === 'PISO' || n.tipo === 'BLOQUE')
  const enst    = chain.find(n => n.tipo === 'ENST' || n.tipo === 'ESPACIO_COMUN')
  const leaf    = chain[chain.length - 1]
  const penult  = chain.length > 1 ? chain[chain.length - 2] : undefined

  return {
    edificio:     unidad?.nombre ?? chain[0]?.nombre ?? 'SIN EDIFICIO',
    piso:         piso?.nombre   ?? penult?.nombre   ?? 'SIN PISO',
    arrendatario: enst?.nombre   ?? leaf?.nombre     ?? 'SIN ARRENDATARIO',
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Construcción del Pivot ────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

export function buildPivot(
  records:   RegistroMedidor[],
  infraMap:  Map<number, InfraestructuraResponse>,
): { pivot: EdificioGroup[]; months: string[] } {

  // Meses únicos ordenados (YYYY-MM)
  const monthSet = new Set<string>()
  records.forEach(r => monthSet.add(r.fechaRegistro.slice(0, 7)))
  const months = Array.from(monthSet).sort()

  // Agrupar registros por arrendatario (infraestructuraId) y tipoServicio
  const tenantMap = new Map<
    string,
    { ancestors: Ancestors; byMonth: Record<string, PivotCell> }
  >()

  for (const record of records) {
    const id = record.infraestructuraId
    const tipo = record.tipoServicio
    const key = `${id}_${tipo}`

    if (!tenantMap.has(key)) {
      const ancestors = getAncestors(id, infraMap)
      const tipoLabel = tipo === 1 ? '(Luz)' : tipo === 2 ? '(Agua)' : ''
      ancestors.arrendatario = `${ancestors.arrendatario} ${tipoLabel}`
      tenantMap.set(key, { ancestors, byMonth: {} })
    }
    const entry    = tenantMap.get(key)!
    const monthKey = record.fechaRegistro.slice(0, 7)
    // Si hay varios registros en el mismo mes: tomar el de mayor voltaje
    const existing = entry.byMonth[monthKey]
    if (!existing || Number(record.voltaje) > Number(existing.voltaje)) {
      entry.byMonth[monthKey] = {
        voltaje:     record.voltaje,
        consumo:     record.consumo,
        observacion: record.observacion,
      }
    }
  }

  // Construir árbol Edificio → Piso → Arrendatario
  const edificioMap = new Map<string, Map<string, Map<string, ArrendatarioRow>>>()

  for (const [key, { ancestors, byMonth }] of tenantMap) {
    if (!edificioMap.has(ancestors.edificio)) {
      edificioMap.set(ancestors.edificio, new Map())
    }
    const pisoMap = edificioMap.get(ancestors.edificio)!
    if (!pisoMap.has(ancestors.piso)) {
      pisoMap.set(ancestors.piso, new Map())
    }
    const arrendMap = pisoMap.get(ancestors.piso)!
    const originalId = parseInt(key.split('_')[0], 10)
    arrendMap.set(key, { nombre: ancestors.arrendatario, infraestructuraId: originalId, byMonth })
  }

  const pivot: EdificioGroup[] = Array.from(edificioMap.entries()).map(([edName, pisoMap]) => ({
    nombre: edName,
    pisos:  Array.from(pisoMap.entries()).map(([pName, arrendMap]) => ({
      nombre:        pName,
      arrendatarios: Array.from(arrendMap.values()),
    })),
  }))

  return { pivot, months }
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Labels de mes ─────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

const MONTH_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const MONTH_FULL  = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO',
                     'AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE']

const voltajeLabel = (ym: string) => {
  const [y, m] = ym.split('-')
  return `${MONTH_SHORT[+m - 1]}-${y.slice(2)}`
}
const consumoLabel = (ym: string) => `CONSUMO ${MONTH_FULL[+ym.split('-')[1] - 1]}`

// ══════════════════════════════════════════════════════════════════════════════
// ── Helpers de estilo ExcelJS ─────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

type Cell = ExcelJS.Cell

const BORDER_DEF: ExcelJS.Border = { style: 'thin', color: { argb: 'FF333333' } }
const BORDERS: Partial<ExcelJS.Borders> = {
  top: BORDER_DEF, left: BORDER_DEF, bottom: BORDER_DEF, right: BORDER_DEF,
}

const BASE_FONT: Partial<ExcelJS.Font> = { name: 'Calibri', size: 10 }

function setBlackHeader(cell: Cell) {
  cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF000000' } }
  cell.font      = { ...BASE_FONT, bold: true, color: { argb: 'FFFFFFFF' } }
  cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
  cell.border    = BORDERS
}

function setYellowVoltaje(cell: Cell) {
  cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFD966' } }
  cell.font      = { ...BASE_FONT, bold: true, color: { argb: 'FF000000' } }
  cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
  cell.border    = BORDERS
}

function setYellowConsumoHeader(cell: Cell) {
  cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFD966' } }
  cell.font      = { ...BASE_FONT, bold: true, color: { argb: 'FFFF0000' } }
  cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
  cell.border    = BORDERS
}

function setDataCell(cell: Cell, hAlign: ExcelJS.Alignment['horizontal'] = 'center') {
  cell.font      = { ...BASE_FONT }
  cell.alignment = { vertical: 'middle', horizontal: hAlign, wrapText: true }
  cell.border    = BORDERS
}

function setConsumoData(cell: Cell) {
  cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6E0B4' } }
  cell.font      = { ...BASE_FONT }
  cell.alignment = { vertical: 'middle', horizontal: 'center' }
  cell.border    = BORDERS
}

function setMergedCenter(cell: Cell) {
  cell.font      = { ...BASE_FONT, bold: true }
  cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
  cell.border    = BORDERS
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Generación del Excel ──────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

export async function generateMedidoresExcel(
  pivot:    EdificioGroup[],
  months:   string[],
  dateFrom: string,
  dateTo:   string,
): Promise<void> {

  const workbook = new ExcelJS.Workbook()
  workbook.creator  = 'Centrica Medidores'
  workbook.created  = new Date()

  const sheet = workbook.addWorksheet('Reporte', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true },
    views: [{ state: 'frozen', xSplit: 3, ySplit: 1 }],
  })

  // ── Anchos de columna ──────────────────────────────────────────────────────
  const STATIC = 3
  const totalCols = STATIC + months.length * 2 + 1

  sheet.getColumn(1).width = 22   // EDIFICIO
  sheet.getColumn(2).width = 16   // PISO
  sheet.getColumn(3).width = 26   // ARRENDATARIOS

  for (let i = 4; i <= STATIC + months.length; i++)            sheet.getColumn(i).width = 11   // voltaje
  for (let i = STATIC + months.length + 1; i <= totalCols - 1; i++) sheet.getColumn(i).width = 20   // consumo
  sheet.getColumn(totalCols).width = 30  // COMENTARIOS

  // ── Fila de título del reporte ─────────────────────────────────────────────
  const titleRow = sheet.addRow(new Array(totalCols).fill(null))
  titleRow.height = 22
  const titleCell = titleRow.getCell(1)
  titleCell.value = `REPORTE DE MEDIDORES — ${dateFrom} al ${dateTo}`
  titleCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F3864' } }
  titleCell.font  = { ...BASE_FONT, bold: true, size: 12, color: { argb: 'FFFFFFFF' } }
  titleCell.alignment = { vertical: 'middle', horizontal: 'left' }
  sheet.mergeCells(1, 1, 1, totalCols)

  // ── Fila de cabecera ───────────────────────────────────────────────────────
  const headerRow = sheet.addRow(new Array(totalCols).fill(null))
  headerRow.height = 30

  setBlackHeader(headerRow.getCell(1)); headerRow.getCell(1).value = 'EDIFICIO'
  setBlackHeader(headerRow.getCell(2)); headerRow.getCell(2).value = 'PISO'
  setBlackHeader(headerRow.getCell(3)); headerRow.getCell(3).value = 'ARRENDATARIOS'

  months.forEach((m, i) => {
    const cell = headerRow.getCell(4 + i)
    cell.value = voltajeLabel(m)
    setYellowVoltaje(cell)
  })

  months.forEach((m, i) => {
    const cell = headerRow.getCell(4 + months.length + i)
    cell.value = consumoLabel(m)
    setYellowConsumoHeader(cell)
  })

  const hComent = headerRow.getCell(totalCols)
  hComent.value = 'COMENTARIOS'
  setBlackHeader(hComent)

  // ── Filas de datos ─────────────────────────────────────────────────────────
  let rowIdx = 3  // 1=título, 2=header, 3=primera data (1-indexed para ExcelJS)

  for (const edificio of pivot) {
    const edStart = rowIdx

    for (const piso of edificio.pisos) {
      const pisoStart = rowIdx

      for (const arrend of piso.arrendatarios) {
        const dataRow = sheet.addRow(new Array(totalCols).fill(null))
        dataRow.height = 18

        // EDIFICIO
        const cEd = dataRow.getCell(1)
        cEd.value = edificio.nombre
        setDataCell(cEd, 'center')

        // PISO
        const cPiso = dataRow.getCell(2)
        cPiso.value = piso.nombre
        setDataCell(cPiso, 'center')

        // ARRENDATARIO
        const cAr = dataRow.getCell(3)
        cAr.value = arrend.nombre
        setDataCell(cAr, 'left')

        // Voltaje por mes
        months.forEach((m, i) => {
          const cell = dataRow.getCell(4 + i)
          const data = arrend.byMonth[m]
          if (data?.voltaje != null) {
            cell.value  = Number(Number(data.voltaje).toFixed(2))
            cell.numFmt = '#,##0.00'
          }
          setDataCell(cell, 'center')
        })

        // Consumo por mes
        months.forEach((m, i) => {
          const cell = dataRow.getCell(4 + months.length + i)
          const data = arrend.byMonth[m]
          if (data?.consumo != null) {
            cell.value  = Number(Number(data.consumo).toFixed(2))
            cell.numFmt = '#,##0.00'
          }
          setConsumoData(cell)
        })

        // Comentarios — última observación no nula del período
        const cComent = dataRow.getCell(totalCols)
        const lastObs = months.map(m => arrend.byMonth[m]?.observacion).filter(Boolean).pop() ?? null
        cComent.value = lastObs
        setDataCell(cComent, 'left')

        rowIdx++
      }

      // Merge PISO si tiene más de 1 arrendatario
      if (piso.arrendatarios.length > 1) {
        sheet.mergeCells(pisoStart, 2, rowIdx - 1, 2)
        setMergedCenter(sheet.getCell(pisoStart, 2))
        sheet.getCell(pisoStart, 2).value = piso.nombre
      }
    }

    // Merge EDIFICIO
    const totalArr = edificio.pisos.reduce((s, p) => s + p.arrendatarios.length, 0)
    if (totalArr > 1) {
      sheet.mergeCells(edStart, 1, rowIdx - 1, 1)
      setMergedCenter(sheet.getCell(edStart, 1))
      sheet.getCell(edStart, 1).value = edificio.nombre
    }
  }

  // ── Descarga ───────────────────────────────────────────────────────────────
  const buffer = await workbook.xlsx.writeBuffer()
  const blob   = new Blob(
    [buffer],
    { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
  )
  const from = dateFrom.replace(/-/g, '')
  const to   = dateTo.replace(/-/g, '')
  saveAs(blob, `Reporte_Medidores_${from}_${to}.xlsx`)
}
