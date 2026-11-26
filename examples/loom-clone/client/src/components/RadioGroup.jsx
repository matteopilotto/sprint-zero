// A labelled row of radio buttons, used for every "pick one" recorder control.
export default function RadioGroup({ legend, name, options, value, onChange }) {
  return (
    <fieldset>
      <legend>{legend}</legend>
      <div className="choices">
        {options.map((option) => (
          <label key={option.value} className="choice">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
