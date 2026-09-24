# DTOs

Data transfer objects for each feature (Auth, Properties, Units, Contracts, Payments,
Maintenance, Notifications). Controllers in Rentify.API will only ever accept/return these
— never Domain entities directly. Added per-feature starting in the phase that implements
that feature.
