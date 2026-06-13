import React from "react";
import Select from "react-select";

const SingleSelect = ({
  options = [],
  value = null,
  onChange,
  placeholder = "Select an option",
  isDisabled = false,
}) => {
  return (
    <Select
      options={options}
      value={options.find((item) => item.value === value) || null}
      onChange={(selectedOption) =>
        onChange(selectedOption ? selectedOption.value : null)
      }
      placeholder={placeholder}
      isDisabled={isDisabled}
      isClearable
      classNamePrefix="singleSelect"
    />
  );
};

export default SingleSelect;