import { useId, useRef, useState } from 'react'
import { vehicleBrands } from '../../data/vehicleBrands'
import { useLanguage } from '../../context/LanguageContext'
import styles from './VehicleBrandCombobox.module.css'

const displayBrand = (brand, t) => brand === 'Other' ? t('other') : brand

function VehicleBrandCombobox({ value, onChange }) {
  const { t } = useLanguage()
  const inputId = useId()
  const listboxId = `${inputId}-listbox`
  const inputRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(() => displayBrand(value, t))
  const [activeIndex, setActiveIndex] = useState(0)
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const options = vehicleBrands.filter((brand) => displayBrand(brand, t).toLocaleLowerCase().includes(normalizedQuery))

  const selectBrand = (brand) => {
    onChange(brand)
    setQuery(displayBrand(brand, t))
    setOpen(false)
    inputRef.current?.focus()
  }
  const close = () => {
    setOpen(false)
    setQuery(displayBrand(value, t))
  }
  const onKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((index) => Math.min(index + 1, Math.max(options.length - 1, 0)))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Enter' && open && options[activeIndex]) {
      event.preventDefault()
      selectBrand(options[activeIndex])
    } else if (event.key === 'Escape') {
      close()
    }
  }
  return <div className={styles.combobox}><input ref={inputRef} id={inputId} className={styles.input} role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls={listboxId} aria-activedescendant={open && options[activeIndex] ? `${inputId}-${options[activeIndex]}` : undefined} value={query} onFocus={() => { setOpen(true); setActiveIndex(0) }} onChange={(event) => { setQuery(event.target.value); setOpen(true); setActiveIndex(0) }} onKeyDown={onKeyDown} onBlur={() => window.setTimeout(close, 120)} autoComplete="off" />{open && <ul id={listboxId} className={styles.options} role="listbox">{options.length === 0 ? <li className={styles.empty}>{t('noBrandsFound')}</li> : options.map((brand, index) => <li id={`${inputId}-${brand}`} className={index === activeIndex ? styles.active : ''} role="option" aria-selected={brand === value} key={brand} onMouseDown={(event) => event.preventDefault()} onClick={() => selectBrand(brand)}>{displayBrand(brand, t)}</li>)}</ul>}</div>
}

export default VehicleBrandCombobox
