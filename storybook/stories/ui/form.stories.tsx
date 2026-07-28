// The form wrapper is the only ui primitive with a required peer context: every
// field must sit under a <Form> (react-hook-form's FormProvider) or useFormField
// throws. That makes it worth its own story — the failure is a runtime crash, not
// a visual glitch.

import type { Meta, StoryObj } from "@storybook/react-vite";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@storefront/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@storefront/ui/form";
import { Input } from "@storefront/ui/input";
import { Textarea } from "@storefront/ui/textarea";

interface Values {
  email: string;
  postcode: string;
  note: string;
}

const meta: Meta = {
  title: "ui/Form",
  component: FormItem,
  subcomponents: { FormLabel, FormControl, FormDescription, FormMessage },
};
export default meta;
// Loose args: these files group several components, so a story's args are not
// the meta component's props.
type Story = StoryObj;

function CheckoutForm({ withErrors = false }: { withErrors?: boolean }) {
  const form = useForm<Values>({
    defaultValues: { email: withErrors ? "not-an-email" : "", postcode: "", note: "" },
    mode: "onChange",
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((v) => toast.success(`Submitted as ${v.email}`))}
        className="max-w-sm space-y-6"
      >
        <FormField
          control={form.control}
          name="email"
          rules={{
            required: "An email is required.",
            pattern: { value: /.+@.+\..+/, message: "That doesn't look like an email." },
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="you@example.com" {...field} />
              </FormControl>
              <FormDescription>We'll send the order confirmation here.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="postcode"
          rules={{ required: "A postcode is required." }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Postcode</FormLabel>
              <FormControl>
                <Input placeholder="D02 XY45" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Delivery note</FormLabel>
              <FormControl>
                <Textarea rows={3} placeholder="Leave it with a neighbour…" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Continue to payment</Button>
      </form>
    </Form>
  );
}

export const Default: Story = {
  render: () => <CheckoutForm />,
};

/** Submit with the fields untouched to see every FormMessage at once. */
export const WithValidationErrors: Story = {
  render: () => <CheckoutForm withErrors />,
};
