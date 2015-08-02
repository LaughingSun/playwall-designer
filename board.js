"use strict";

function Board (conf) {
  var ASlice = Array.prototype.slice
    , _modAcross      = (conf || (conf = {})).across || 5
    , _modDown        = conf.down || 3
    , _modWidth       = conf.width || 4
    , _modHeight      = conf.height || 4
    , _modc           = _modWidth * _modHeight
    , _colc           = _modAcross * _modWidth
    , _rowc           = _modDown * _modHeight
    , _cellc          = _colc * _rowc
    , _pixMemSize     = _cellc * 3
    , _updateInterval = conf.nterval || 100
    , _pixelBuffer    = new Uint8Array(_pixMemSize)
    , _senMemSize     = (_cellc / 2) | 0
    , _sensorBuffer   = new Uint8Array(_senMemSize)
    , _pixelMap2Buf   = new Uint16Array(_cellc)
    , _pixelBuf2Map   = new Uint16Array(_cellc)
    , _sensorMap2Buf  = new Uint16Array(_cellc)
    , _sensorBuf2Map  = new Uint16Array(_cellc)
    , _pixelMap       = new Uint32Array(_cellc)
    , _sensorMap      = new Uint8Array(_cellc)
    , _updateInterval = null

    ; initPixelIndexMap();
    ; initSensorIndexMap();
    ; createBoard();

    ; return Object.defineProperties({}, {
      pixelBuf2MapIndexMap: {
        get: function () { return ASlice.call(_pixelBuf2Map) }
      }
      , pixelMap2BufIndexMap: {
        get: function () { return ASlice.call(_pixelMap2Buf) }
      }
      , pixelBuffer: {
        value: _pixelBuffer
      }
      , sensorBuffer: {
        value: _sensorBuffer
      }
      , pixelMap: {
        value: _pixelMap
      }
      , width: {
        value: _colc
      }
      , height: {
        value: _rowc
      }
    })
    ;


  function createBoard() {
    var cellsAll = []
      , boardCntnr, row, cell, pix, i, j, k

    ; if (boardCntnr instanceof HTMLElement) document.body.removeChild(boardCntnr)
    ; if (_updateInterval !== null) {
      clearInterval(_updateInterval)
      ; _updateInterval = null
    }
    ; (boardCntnr = document.createElement('div')).className = 'board'
    ; i = 0
    ; while (i++ < _rowc) {
      j = 0
      ; (row = boardCntnr.appendChild(document.createElement('div'))).className = 'row'
      ; while (j++ < _colc) {
        k = (i-1) * _colc + j - 1
        ; (cell = row.appendChild(document.createElement('div'))).className = 'cell'
        ; (pix = cell.appendChild(document.createElement('div'))).className = 'pixel'
        ; pix.title = [j, ',', i, ':', _pixelMap2Buf[k]].join('')
        ; cellsAll.push(pix)
        ; pix.addEventListener('mousedown', function (evt) {
          this.dataset.sensor = 1
        })
        ; pix.addEventListener('mouseup', function (evt) {
          this.dataset.sensor = 0
        })
      }
    }
    document.body.appendChild(boardCntnr)

    ; _updateInterval = setInterval(updateBoard, _updateInterval || 100);

    function updateBoard () {
      var i, p, n, r, g, b

      ; i = _cellc
      ; while (i--) {
        p = _pixelMap2Buf[i]
        ; if ((r = _pixelBuffer[p++].toString(16)).length < 2) r = '0' + r
        ; if ((g = _pixelBuffer[p++].toString(16)).length < 2) g = '0' + g
        ; if ((b = _pixelBuffer[p++].toString(16)).length < 2) b = '0' + b
        ; cellsAll[i].style.backgroundColor = ['#', r, g, b].join('')
      }

      ; i = _cellc
      ; while ((i-=2) >= 0) {
        p = _sensorMap2Buf[i]
        ; _sensorBuffer[p] = (cellsAll[i].dataset.sensor << 2) | (cellsAll[i+1].dataset.sensor << 6)
      }
    }

  }

  function initPixelIndexMap () {
    var index = 0
      , ma, mo, mi, pi, px, py

    ; while (index < _cellc) {

      mi = index % _modc
      mo = ((index - mi) / _modc) | 0
      ; px = mi % _modWidth + (mo % _modAcross) * _modWidth
      ; py = ((mi / _modHeight) | 0) + ((mo / _modAcross) | 0) * _modHeight
      ; pi = py * _colc + px
      ; ma = index++ * 3
      ; _pixelMap2Buf[pi] = ma
      ; _pixelBuf2Map[ma] = pi
    }
  }

  function initSensorIndexMap () {
    var index = 0
      , ma, mo, mi, pi, px, py

    ; while (index < _cellc) {

      mi = index % _modc
      mo = ((index - mi) / _modc) | 0
      ; px = mi % _modWidth + (mo % _modAcross) * _modWidth
      ; py = ((mi / _modHeight) | 0) + ((mo / _modAcross) | 0) * _modHeight
      ; pi = py * _colc + px
      ; ma = index++ / 2
      ; _sensorMap2Buf[pi] = ma
      ; _sensorBuf2Map[ma] = pi
    }
  }


  /** populate pixel buffer from 32 bit array */
  function writePixels (sourceUInt32Data, sourceOffset, pixelOffset, count, pixelOffsetInc, adjustSourceOffset, adjustPixelOffset, repeat) {
    var i, p, pi, ri, rc
    
    ; pixelOffsetInc || (pixelOffsetInc = 1)
    ; adjustSourceOffset || (adjustSourceOffset = count)
    ; adjustPixelOffset || (adjustPixelOffset = count)
    ; repeat || (repeat = 1)
    while (repeat--) {
      rc = count
      ; while (rc--) {
        setPixel(sourceUInt32Data[sourceOffset], pixelOffset)
        pixelOffset += pixelOffsetInc
      }
      sourceOffset += adjustSourceOffset
      ; pixelOffset += adjustPixelOffset
    }
  }

  function getSensor (index) {
    var i, pi
    
    ; if (index !== (index | 0)) throw new Error(['Sensor index must be an integer: ', index].join(''))
    ; if (index < 0 || index >= _cellc) throw new Error(['Sensor index out of bounds: ', 0, ' <= ', index, ' < ', _cellc].join(''))
    ; if (value !== (value | 0) || value < 0 || value > 0xffffff) throw new Error(['Sensor value must be a 24 bt rgb value: ', 0, ' <= ', value, ' <= 0xFFFFFF'].join(''))

    ; pi = i<<1+i;
    pixelBuffer[pi+0] = value & 0xff;
    pixelBuffer[pi+1] = value >> 8 & 0xff;
    pixelBuffer[pi+2] = value >> 16 & 0xff;
  }

  /** populate pixel buffer from 32 bit array */
  function readSensors (destUInt8Data, destOffset, sensorOffset, count, sensorOffsetInc, adjustDestOffset, adjustSensorOffset, repeat) {
    var i, p, pi, ri, rc
    
    ; pixelOffsetInc || (pixelOffsetInc = 1)
    ; adjustSourceOffset || (adjustSourceOffset = count)
    ; adjustPixelOffset || (adjustPixelOffset = count)
    ; repeat || (repeat = 1)
    while (repeat--) {
      rc = count
      ; while (rc--) {
        setPixel(sourceUInt32Data[sourceOffset], pixelOffset)
        pixelOffset += pixelOffsetInc
      }
      sourceOffset += adjustSourceOffset
      ; pixelOffset += adjustPixelOffset
    }
  }
    
}
