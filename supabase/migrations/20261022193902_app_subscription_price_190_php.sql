update public.pricing_plans
  set is_active = false
  where plan_type = 'app'
    and is_active;

insert into public.pricing_plans (
  plan_type,
  display_amount,
  display_currency,
  billing_amount_php,
  is_active
)
values ('app', 3.00, 'USD', 190.00, true);
