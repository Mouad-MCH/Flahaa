import React from "react";
import { Button } from "./ui";

const FarmCart = ({ farm, selectFarm }) => {
  return (
    <div className="relative border flex flex-col justify-between hover:border-field hover:-translate-y-0.5 transition-all duration-75 cursor-pointer rounded-md overflow-hidden">
      <div className="w-full h-30 overflow-hidden">
        <img src="/images/farm.png" alt="" />
      </div>

        <div className="absolute top-25 left-5 w-10 h-10 rounded-md bg-white flex items-center justify-center">
          <img src="/icons/Logo.png" alt="" />
        </div>

      <div className="p-2 mb-2 mt-3">
        <h2 className="font-medium mb-3">{farm.name}</h2>
        <p className="text-sm font-medium text-ink-2"> {farm.address} </p>
      </div>

      <div className="w-full p-2">
        <Button
          className="w-full h-9 cursor-pointer"
          onClick={() => selectFarm(farm._id)}
        >
          <h3>select farm</h3>
        </Button>
      </div>
    </div>
  );
};

export default FarmCart;
