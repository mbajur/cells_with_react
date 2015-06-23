class ReactRailsWrapperCell < Cell::ViewModel
  include React::Rails::ViewHelper

  def show
    render
  end

end
