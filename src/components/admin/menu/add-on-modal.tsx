"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { AddOnData } from "@/actions/menu";

interface AddOnModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingAddOn: AddOnData | null;
  onSave: (data: {
    name: string;
    price: number;
    isAvailable: boolean;
  }) => Promise<void>;
  isPending: boolean;
}

export function AddOnModal({
  isOpen,
  onClose,
  editingAddOn,
  onSave,
  isPending,
}: AddOnModalProps) {
  const [prevEditingAddOn, setPrevEditingAddOn] = useState<AddOnData | null>(editingAddOn);
  const [prevIsOpen, setPrevIsOpen] = useState<boolean>(isOpen);

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    isAvailable: true,
  });

  if (editingAddOn !== prevEditingAddOn || isOpen !== prevIsOpen) {
    setPrevEditingAddOn(editingAddOn);
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setFormData(
        editingAddOn
          ? {
              name: editingAddOn.name,
              price: editingAddOn.price.toString(),
              isAvailable: editingAddOn.isAvailable,
            }
          : {
              name: "",
              price: "",
              isAvailable: true,
            }
      );
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Add-on option name is required.");
      return;
    }
    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum < 0) {
      toast.error("Please enter a valid extra price.");
      return;
    }

    await onSave({
      name: formData.name,
      price: priceNum,
      isAvailable: formData.isAvailable,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingAddOn ? "Edit Add-On / Modifier" : "Create New Add-On / Modifier"}
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
        <Input
          label="Add-On Option Name"
          placeholder="e.g. Cheese Slice, Garlic Dip, Cold Drink 250ml"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />

        <Input
          label="Extra Price (PKR)"
          type="number"
          step="0.01"
          placeholder="e.g. 120"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          required
        />

        <div className="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-200 rounded-md">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
            Option Availability
          </span>
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={formData.isAvailable}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  isAvailable: e.target.checked,
                })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 relative"></div>
            <span className="text-sm font-semibold text-slate-800">
              {formData.isAvailable ? "Available ON POS" : "Disabled"}
            </span>
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isPending}>
            {editingAddOn ? "Update Modifier" : "Create Modifier"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
